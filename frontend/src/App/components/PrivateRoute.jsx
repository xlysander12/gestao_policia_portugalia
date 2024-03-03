import {Navigate} from "react-router-dom";
import {Component} from "react";


class PrivateRoute extends Component {

    constructor(props) {
        super(props);

        this.state = {
            authorized: true
        }
    }

    async componentDidMount() {
        // Check if there is a token in the local storage
        if (!localStorage.getItem("token")) {
            this.setState({
                authorized: false
            });
        }

        let forces = {
            psp: false,
            gnr: false
        }

        for (const force of ["psp", "gnr"]) {
            const response = await fetch("/portugalia/gestao_policia/api/validateToken", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("token"),
                    "X-PortalSeguranca-Force": force
                }
            });

            // If the request returned status of 200, the token is valid for that force
            if (response.status === 200) {
                // Set the force to true
                forces[force] = true;
            }
        }

        // If the user is not from any force, redirect to the login page
        if (!forces.psp && !forces.gnr) {
            this.setState({
                authorized: false
            });
        }

        // If there is no force set in the local storage, set it to the first force the user is from
        if (!localStorage.getItem("force")) {
            if (forces.psp) {
                localStorage.setItem("force", "psp");
            } else {
                localStorage.setItem("force", "gnr");
            }
        }
    }

    render() {
        return this.state.authorized ? <this.props.element /> : <Navigate to="/login"/>
    }
}
export default PrivateRoute;