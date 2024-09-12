import {ReactElement, useContext, useEffect, useState} from "react";
import {make_request} from "../../utils/requests";
import {useNavigate} from "react-router-dom";
import {LoggedUserContext, LoggedUserContextType} from "./logged-user-context.ts";
import Navbar from "../Navbar/navbar";
import {
    AccountInfoResponse,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/api/account/schema";
import Loader from "../Loader/loader.tsx";
import {toast} from "react-toastify";
import {OfficerInfoGetResponse} from "@portalseguranca/api-types/api/officer-info/schema";

type PrivateRouteProps = {
    element: ReactElement
    isLoginPage?: boolean
}

function PrivateRoute({element, isLoginPage = false}: PrivateRouteProps): ReactElement {
    // Initialize state
    const [authorized, setAuthorized] = useState<boolean>(false);
    const [loggedUser, setLoggedUser] = useState<LoggedUserContextType>(useContext(LoggedUserContext));

    // Initialize navigate hook
    const navigate = useNavigate();

    // When the component mounts and when the page changes, also check if the user is logged in and has permission to access the page
    useEffect(() => {
        // First, set the authorized state to false
        setAuthorized(false);

        // Before doing anything, check if the flag "needsReload" is set to true. If it is, reload the page
        if (localStorage.getItem("needsReload")) {
            localStorage.removeItem("needsReload");
            window.location.reload();
        }

        const checkAuthentication = async () => {
            // Check if there is a force in the local storage. If there isn't, return to login
            if (!localStorage.getItem("force")) {
                return navigate("/login");
            }

            // Since there's a force in local storage, check if the token stored in the cookies is valid for that force
            const response = await make_request("/accounts/validateToken", "POST", {redirectToLoginOn401: false});

            // If the request returned status 401, the token isn't valid and the user should be redirected to login
            if (response.status === 401) {
                toast("Sessão inválida. Por favor, faça login novamente.", {
                    type: "error",
                });
                return navigate("/login");
            }

            // Since the response was positive, use the nif gotten from the token to get the user's information and intents
            const nif = ((await response.json()) as ValidateTokenResponse).data

            // * Using the nif, get the user's information and intents
            const userResponse = await make_request(`/officers/${nif}?raw`, "GET");

            // Get the data from the response
            const responseJson: OfficerInfoGetResponse = await userResponse.json();
            const userData = responseJson.data;

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
            const accountInfoResponse = await make_request(`/accounts/${tempLoggedUser.info.personal.nif}/info`, "GET");
            const accountInfoData = (await accountInfoResponse.json()) as AccountInfoResponse;
            tempLoggedUser.intents = accountInfoData.data.intents;

            // Fetch all forces the user belongs to
            const accountForcesResponse = await make_request(`/accounts/${tempLoggedUser.info.personal.nif}/forces`, "GET");
            const accountForcesData = (await accountForcesResponse.json()) as UserForcesResponse;
            tempLoggedUser.forces = accountForcesData.data.forces;

            // Set the logged user with the data fetched
            setLoggedUser(tempLoggedUser);

            // Since the token is valid for the force, redirect the user to the requested page
            setAuthorized(true);
        }

        // Call the function to check the authentication only if we're not in the login page
        if (!isLoginPage)
            checkAuthentication();

    }, [isLoginPage, element]);

    if (!authorized && !isLoginPage) {
        return (
            <Loader fullPage/>
        );
    }

    return (
        <LoggedUserContext.Provider value={loggedUser}>
                <Navbar isLoginPage={isLoginPage}/>
                <div style={{height: "cacl(100vh - calc(4rem + 16px))"}}>
                    {element}
                </div>
        </LoggedUserContext.Provider>
);
}

export default PrivateRoute;