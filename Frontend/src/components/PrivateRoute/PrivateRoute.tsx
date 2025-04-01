import {ReactElement, useCallback, useContext, useEffect, useState} from "react";
import {make_request} from "../../utils/requests";
import {useLocation, useNavigate} from "react-router-dom";
import {LoggedUserContext, LoggedUserContextType} from "./logged-user-context.ts";
import {Navbar} from "../Navbar";
import {
    AccountInfoResponse,
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

    const checkToken = async (): Promise<{valid: boolean, nif: number}> => {
        // Check if there is a force in the local storage. If there isn't, return to login
        if (!localStorage.getItem("force")) {
            redirectLogin();
            return {valid: false, nif: 0};
        }

        // Since there's a force in local storage, check if the token stored in the cookies is valid for that force
        const response = await make_request("/accounts/validate-token", "POST", {redirectToLoginOn401: false});

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

    const fetchLoggedUserInfo = async (nif: number): Promise<LoggedUserContextType> => {
        const userResponse = await make_request(`/officers/${nif}`, "GET");

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
                patent: getObjectFromId(userData.patent as number, forceData.patents)!,
                callsign: userData.callsign,
                status: getObjectFromId(userData.status as number, forceData.statuses)!,
                entry_date: moment.unix(userData.entry_date),
                promotion_date: userData.promotion_date ? moment.unix(userData.promotion_date) : null,
                special_units: userData.special_units.map((unit) => {
                    return {
                        unit: getObjectFromId(unit.id as number, forceData.special_units)!,
                        role: getObjectFromId(unit.role as number, forceData.special_unit_roles)!
                    };
                })
            }
        }
        

        // Fetch the user's intents
        const accountInfoResponse = await make_request(`/accounts/${tempLoggedUser.info.personal.nif}`, "GET");
        const accountInfoData = (await accountInfoResponse.json()) as AccountInfoResponse;
        tempLoggedUser.intents = accountInfoData.data.intents;

        // Fetch all forces the user belongs to
        const accountForcesResponse = await make_request(`/accounts/${tempLoggedUser.info.personal.nif}/forces`, "GET");
        const accountForcesData = (await accountForcesResponse.json()) as UserForcesResponse;
        tempLoggedUser.forces = accountForcesData.data.forces;

        return tempLoggedUser;
    }

    const updateValues = async (checkAuth = true) => {
        // First, set the authorized state to false, if required
        if (checkAuth) {
            setAuthorized(false);
        }

        let nif = loggedUser.info.personal.nif;

        // Checking if the token is valid
        if (checkAuth) {
            const result = await checkToken();

            if (!result.valid) return; // Redirecting to login page is handled by the upper function

            // Set the nif to the one fetched from the token validation
            nif = result.nif;
        }


        // Fetch the Logged User's information
        const userInfo = await fetchLoggedUserInfo(nif);

        // Set the logged user with the data fetched
        setLoggedUser({...userInfo});

        // Since the token is valid for the force, redirect the user to the requested page
        if (checkAuth) {
            setAuthorized(true);
        }
    }

    // Add the Socket Event listener for the logged user's data
    useWebSocketEvent("officers", useCallback((data: OfficerSocket) => {
        if (data.nif === loggedUser.info.personal.nif) {
            updateValues(false);
        }
    }, [socket?.id, loggedUser.info.personal.nif]), socket);

    // When the component mounts and when the page changes, also check if the user is logged in and has permission to access the page
    useEffect(() => {
        // Call the function to check the authentication only if we're not in the login page
        if (!isLoginPage) {
            updateValues();
        }

    }, [isLoginPage, element]);

    // Create the websocket connection when not in the login page
    useEffect(() => {
        let newSocket: Socket | null = null;

        if (!isLoginPage) {
            newSocket = io({
                path: "/portugalia/portalseguranca/ws",
                transports: ["websocket"],
                auth: {
                    force: localStorage.getItem("force")
                },
                withCredentials: true
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket && newSocket.connected) {
                newSocket.disconnect();
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