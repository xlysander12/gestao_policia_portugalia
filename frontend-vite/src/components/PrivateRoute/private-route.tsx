import {ReactElement, useContext, useEffect, useState} from "react";
import {make_request} from "../../utils/requests";
import {useNavigate} from "react-router-dom";
import {LoggedUserContext, LoggedUserContextType} from "./logged-user-context.tsx";
import {INTENTS} from "../../utils/constants.ts";

type PrivateRouteProps = {
    element: ReactElement
}

function PrivateRoute({element}: PrivateRouteProps): ReactElement {
    // Initialize state
    const [authorized, setAuthorized] = useState<boolean>(false);
    const [msgVisible, setMsgVisible] = useState<boolean>(false);
    const [loggedUser, setLoggedUser] = useState<LoggedUserContextType>(useContext(LoggedUserContext));

    // Initialize navigate hook
    const navigate = useNavigate();

    // When the component mounts, set a timer for 3 seconds to show the messsage
    useEffect(() => {
        setTimeout(() => {
            setMsgVisible(true);
        }, 3000);
    }, []);

    // When the component mounts, also check if the user is logged in and has permission to access the page
    useEffect(() => {
        const checkAuthentication = async () => {
            // Check if there is a token or force in the local storage. If there isn't, return to login
            if (!localStorage.getItem("token") || !localStorage.getItem("force")) {
                return navigate("/login");
            }

            // Since there's a token and force in local storage, check if the token is valid for that force
            const response = await make_request("/account/validateToken", "POST");

            // If the request returned status different of 200, the token isn't valid and the user should be redirected to login
            if (response.status !== 200) {
                return navigate("/login");
            }

            // Since the response was positive, use the nif gotten from the token to get the user's information and intents
            const nif = (await response.json()).data

            // Using the nif, get the user's information and intents
            const userResponse = await make_request(`/officerinfo/${nif}?raw`, "GET");

            // Making sure the response is positive
            if (userResponse.status !== 200) {
                return navigate("/login");
            }

            // Get the data from the response
            const userData = (await userResponse.json()).data;

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

            tempLoggedUser.info.professional.patent = userData.patent;
            tempLoggedUser.info.professional.callsign = userData.callsign;
            tempLoggedUser.info.professional.status = userData.status;
            tempLoggedUser.info.professional.entry_date = userData.entry_date;
            tempLoggedUser.info.professional.promotion_date = userData.promotion_date;

            // Fetch the user's intents
            let intent: string;
            for (intent of INTENTS) {
                const intentResponse = await make_request(`/account/validateToken`, "POST", {intent: intent});

                if (intentResponse.status === 200) { // Logged user has this intent
                    // @ts-ignore
                    tempLoggedUser.intents[intent] = true;
                }
            }

            // Set the logged user with the data fetched
            setLoggedUser(tempLoggedUser);

            // Since the token is valid for the force, redirect the user to the requested page
            setAuthorized(true);
        }

        checkAuthentication();

    }, []);

    if (!authorized) {
        return (
            <h1 style={msgVisible ? {}: {display: "none"}}>A Autenticar... Por favor, aguarde</h1>
        );
    }

    return (
        <LoggedUserContext.Provider value={loggedUser}>
            {element}
        </LoggedUserContext.Provider>
    );
}

export default PrivateRoute;