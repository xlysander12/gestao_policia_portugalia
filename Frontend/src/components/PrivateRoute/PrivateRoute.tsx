import {ReactElement, useCallback, useContext, useEffect, useState} from "react";
import {make_request} from "../../utils/requests";
import {useLocation, useNavigate} from "react-router-dom";
import {LoggedUserContext, LoggedUserContextType} from "./logged-user-context.ts";
import {Navbar} from "../Navbar";
import {
    AccountInfoResponse, AccountSocket,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/account/output";
import {Loader} from "../Loader";
import {toast} from "react-toastify";
import {OfficerData, OfficerInfoGetResponse, OfficerSocket} from "@portalseguranca/api-types/officers/output";
import style from "./private-route.module.css";
import {io, Socket} from "socket.io-client";
import {WebsocketContext} from "./websocket-context.ts";
import {useForceData, useWebSocketEvent} from "../../hooks";
import {getObjectFromId} from "../../forces-data-context.ts";
import moment from "moment";
import {MODULE} from "@portalseguranca/api-types";
import { OfficerActivitySocket } from "@portalseguranca/api-types/officers/activity/output";

type PrivateRouteProps = {
    element: ReactElement
    handleForceChange: (newForce: string) => void
    isLoginPage?: boolean
}

function PrivateRoute({element, handleForceChange, isLoginPage = false}: PrivateRouteProps): ReactElement {
    // Initialize state
    const [authorized, setAuthorized] = useState<boolean>(false);
    const [loggedUser, setLoggedUser] = useState<LoggedUserContextType>(useContext(LoggedUserContext));
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize navigate and location hooks
    const navigate = useNavigate();
    const location = useLocation();

    // Get the force's data from Context
    const [forceData] = useForceData();

    const redirectLogin = () => {
        if (location.pathname === "/") {
            navigate("/login");
        } else {
            navigate("/login?redirect=" + location.pathname);
        }
    }

    const checkToken = async (signal?: AbortSignal): Promise<{valid: boolean, nif: number}> => {
        // Check if there is a force in the local storage. If there isn't, return to login
        if (!localStorage.getItem("force")) {
            redirectLogin();
            return {valid: false, nif: 0};
        }

        // Since there's a force in local storage, check if the token stored in the cookies is valid for that force
        const response = await make_request("/accounts/validate-session", "POST", {redirectToLoginOn401: false, signal});

        // If the request returned status 401, the token isn't valid and the user should be redirected to login
        if (response.status === 401) {
            toast("Sessão inválida. Por favor, faça login novamente.", {
                type: "error",
            });
            redirectLogin();

            return {valid: false, nif: 0};
        }

        return {valid: true, nif: (await response.json() as ValidateTokenResponse).data};
    }

    const fetchLoggedUserInfo = async (nif: number, signal?: AbortSignal): Promise<LoggedUserContextType> => {
        const userResponse = await make_request(`/officers/${nif}`, "GET", {signal});

        // Get the data from the response
        const responseJson: OfficerInfoGetResponse = await userResponse.json();
        const userData = responseJson.data as OfficerData;

        // Initialize a temp object that will hold the user's information and intents
        const tempLoggedUser: LoggedUserContextType = loggedUser;

        // Fill the temp object with the data from the response
        tempLoggedUser.info = {
            personal: {
                name: userData.name,
                nif: userData.nif,
                phone: userData.phone,
                iban: userData.iban,
                kms: userData.kms,
                discord: userData.discord,
                steam: userData.steam
            },

            professional: {
                patent: getObjectFromId(userData.patent, forceData.patents)!,
                callsign: userData.callsign ?? "",
                status: getObjectFromId(userData.status, forceData.statuses)!,
                entry_date: moment.unix(userData.entry_date),
                promotion_date: userData.promotion_date ? moment.unix(userData.promotion_date) : null,
                special_units: userData.special_units.map((unit) => {
                    return {
                        unit: getObjectFromId(unit.id, forceData.special_units)!,
                        role: getObjectFromId(unit.role, forceData.special_unit_roles)!
                    };
                })
            }
        }
        

        // Fetch the user's intents
        const accountInfoResponse = await make_request(`/accounts/${tempLoggedUser.info.personal.nif}`, "GET", {signal});
        const accountInfoData = (await accountInfoResponse.json()) as AccountInfoResponse;
        tempLoggedUser.intents = accountInfoData.data.intents;

        // Piggy-back the last request to check their authentication methods
        tempLoggedUser.authentication = {
            password: accountInfoData.data.password_login,
            discord: accountInfoData.data.discord_login
        }

        // Fetch all forces the user belongs to
        const accountForcesResponse = await make_request(`/accounts/${tempLoggedUser.info.personal.nif}/forces`, "GET", {signal});
        const accountForcesData = (await accountForcesResponse.json()) as UserForcesResponse;
        tempLoggedUser.forces = accountForcesData.data.forces;

        return tempLoggedUser;
    }

    const updateValues = async (checkAuth = true, showLoading = true, signal?: AbortSignal) => {
        // First, set the authorized state to false, if required
        if (checkAuth && showLoading) {
            setAuthorized(false);
        }

        let nif = loggedUser.info.personal.nif;

        // Checking if the token is valid
        if (checkAuth) {
            const result = await checkToken(signal);

            if (!result.valid) return; // Redirecting to login page is handled by the upper function

            // Set the nif to the one fetched from the token validation
            nif = result.nif;
        }


        // Fetch the Logged User's information
        const userInfo = await fetchLoggedUserInfo(nif, signal);

        // Set the logged user with the data fetched
        setLoggedUser({...userInfo});

        // Since the token is valid for the force, redirect the user to the requested page
        if (checkAuth && showLoading) {
            setAuthorized(true);
        }
    }

    // Add the Socket Event listener for the logged user's data
    useWebSocketEvent<OfficerSocket>(MODULE.OFFICERS, useCallback(data => {
        if (data.nif === loggedUser.info.personal.nif || data.nif === 0) { // If nif is 0, all users were affected
            void updateValues(false);
        }
    }, [socket?.id, loggedUser.info.personal.nif]), socket);

    useWebSocketEvent<OfficerActivitySocket>(MODULE.ACTIVITY, useCallback(data => {
        if (data.type !== "justification") return;

        if (data.nif !== loggedUser.info.personal.nif) return;

        if (data.action === "add") return;

        void updateValues(false);
    }, [socket?.id, loggedUser.info.personal.nif, socket]), socket);

    useWebSocketEvent<AccountSocket>(MODULE.ACCOUNTS, useCallback((data) => {
        if (data.nif !== loggedUser.info.personal.nif) return;

        void updateValues(true, false);
    }, [socket?.id, loggedUser.info.personal.nif, socket]), socket);

    // When the component mounts and when the page changes, also check if the user is logged in and has permission to access the page
    useEffect(() => {
        // Create Abort Controller
        const controller = new AbortController();
        const signal = controller.signal;

        // Call the function to check the authentication only if we're not in the login page
        if (!isLoginPage) {
            void updateValues(true, true, signal);
        }

        return () => {
            controller.abort();
        }
    }, [element]);

    // Create the websocket connection when not in the login page
    useEffect(() => {
        if (isLoginPage) return;
        
        
        // Create socket
        const newSocket = io({
            path: "/portugalia/portalseguranca/ws",
            transports: ["websocket"],
            autoConnect: true,
            
            // Reconnection/backoff options
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 100,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            auth: {
                force: localStorage.getItem("force")
            },
            withCredentials: true
        });

        // Attempt to connect after validating the session/token
        const tryConnect = () => {
            if (!newSocket) return;

            try {
                // Connect (socket.io will perform reconnection attempts automatically if needed)
                newSocket.connect();
            } catch (err) {
                // Silent - will rely on reconnect/backoff and visibility/online triggers
                console.warn("Websocket tryConnect error: ", err);
            }
        };

        // Handlers
        const onConnect = () => {
            // Publish the socket object to state so other hooks/components can use it
            setSocket(newSocket);
        };

        const onConnectError = (err: any) => {
            console.warn("Socket connect_error: ", err);
            // otherwise the socket's reconnection/backoff will handle retries
        };

        const onDisconnect = (reason: string) => {
            // Keep socket object in state (so context consumers see it), but it's disconnected
            console.info("Socket disconnected: ", reason);
        };

        const onReconnectAttempt = (attempt: number) => {
            // Log attempt number
            console.info("Socket reconnect attempt:", attempt);
        };

        const onReconnectFailed = () => {
            toast("Não foi possível reconectar ao servidor. Verifique a sua ligação.", {type: "error"});
        };

        // Attach handlers
        newSocket.on("connect", onConnect);
        newSocket.on("connect_error", onConnectError);
        newSocket.on("disconnect", onDisconnect);
        // socket.io v4 emits 'reconnect_attempt' or 'reconnect_attempt' depending on version; listen to both common names
        newSocket.on("reconnect_attempt", onReconnectAttempt);
        newSocket.on("reconnect_failed", onReconnectFailed);

        // Visibility / online triggers — try to reconnect when the user returns or regains network
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible" && newSocket && !newSocket.connected) {
                void tryConnect();
            }
        };

        const onOnline = () => {
            if (newSocket && !newSocket.connected) {
                void tryConnect();
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("online", onOnline);

        // Start initial connect attempt
        void tryConnect();

        return () => {
            if (newSocket) {
                try {
                    newSocket.off();
                    newSocket.disconnect();
                } catch (e) {
                    console.warn("Error during socket cleanup:", e);
                }
            }

            if (onVisibilityChange) {
                document.removeEventListener("visibilitychange", onVisibilityChange);
            }

            if (onOnline) {
                window.removeEventListener("online", onOnline);
            }
        }
    }, [isLoginPage]);

    if (!authorized && !isLoginPage) {
        return (
            <Loader fullPage/>
        );
    }

    return (
        <WebsocketContext.Provider value={socket}>
            <LoggedUserContext.Provider value={loggedUser}>
                <Navbar isLoginPage={isLoginPage} handleForceChange={handleForceChange}/>
                <div className={style.contentDiv}>
                    {element}
                </div>
            </LoggedUserContext.Provider>
        </WebsocketContext.Provider>
    );
}

export default PrivateRoute;
