import {ReactElement, useCallback, useContext, useEffect, useState} from "react";
import {make_request} from "../../utils/requests";
import {useNavigate} from "react-router-dom";
import {LoggedUserContext, LoggedUserContextType} from "./logged-user-context.ts";
import Navbar from "../Navbar/navbar";
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
import {useWebSocketEvent} from "../../hooks";

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

    // Initialize navigate hook
    const navigate = useNavigate();

    const checkToken = async (): Promise<{valid: boolean, nif: number}> => {
        // Check if there is a force in the local storage. If there isn't, return to login
        if (!localStorage.getItem("force")) {
            navigate("/login");
            return {valid: false, nif: 0};
        }

        // Since there's a force in local storage, check if the token stored in the cookies is valid for that force
        const response = await make_request("/accounts/validate-token", "POST", {redirectToLoginOn401: false});

        // If the request returned status 401, the token isn't valid and the user should be redirected to login
        if (response.status === 401) {
            toast("Sessão inválida. Por favor, faça login novamente.", {
                type: "error",
            });
            navigate("/login");

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
        tempLoggedUser.info.personal.name = userData.name;
        tempLoggedUser.info.personal.nif = userData.nif;
        tempLoggedUser.info.personal.phone = userData.phone;
        tempLoggedUser.info.personal.iban = userData.iban;
        tempLoggedUser.info.personal.kms = userData.kms;
        tempLoggedUser.info.personal.discord = userData.discord;
        tempLoggedUser.info.personal.steam = userData.steam;

        tempLoggedUser.info.professional.patent = userData.patent as number;
        tempLoggedUser.info.professional.callsign = userData.callsign;
        tempLoggedUser.info.professional.status = userData.status as number;
        tempLoggedUser.info.professional.entry_date = userData.entry_date;
        tempLoggedUser.info.professional.promotion_date = userData.promotion_date;
        tempLoggedUser.info.professional.special_units = userData.special_units;

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

    const updateValues = async (showLoading = true) => {
        // First, set the authorized state to false, if required
        if (showLoading) {
            setAuthorized(false);
        }

        // Checking if the token is valid
        const {valid, nif} = await checkToken();

        if (!valid) return; // Redirecting to login page is handled by the upper function

        // Since the token is valid, fetch the Logged User's information
        const userInfo = await fetchLoggedUserInfo(nif);

        // Set the logged user with the data fetched
        setLoggedUser(userInfo);

        // Since the token is valid for the force, redirect the user to the requested page
        if (showLoading) {
            setAuthorized(true);
        }
    }

    // Add the Socket Event listener for the logged user's data
    useWebSocketEvent("officers", useCallback((data: OfficerSocket) => {
        if (data.nif === loggedUser.info.personal.nif) {
            updateValues(false);
        }
    }, [socket?.id, loggedUser.info.personal.nif]));

    // When the component mounts and when the page changes, also check if the user is logged in and has permission to access the page
    useEffect(() => {
        // Before doing anything, check if the flag "needsReload" is set to true. If it is, reload the page
        if (localStorage.getItem("needsReload")) {
            localStorage.removeItem("needsReload");
            window.location.reload();
        }

        // Call the function to check the authentication only if we're not in the login page
        if (!isLoginPage)
            updateValues();

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