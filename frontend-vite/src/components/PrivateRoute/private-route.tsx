import {ReactElement, useEffect, useState} from "react";
import {make_request} from "../../utils/requests";
import {useNavigate} from "react-router-dom";

type PrivateRouteProps = {
    element: ReactElement
}

function PrivateRoute({element}: PrivateRouteProps): ReactElement {
    // Initialize state
    const [authorized, setAuthorized] = useState<boolean>(false);
    const [msgVisible, setMsgVisible] = useState<boolean>(false);

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

    return element;
}

export default PrivateRoute;