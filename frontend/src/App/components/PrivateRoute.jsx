// noinspection JSXUnresolvedComponent

import {Navigate} from "react-router-dom";
import {Component} from "react";
import {make_request} from "../utils/requests";


class PrivateRoute extends Component {

    constructor(props) {
        super(props);

        this.state = {
            authorized: undefined,

            msgVisible: false
        }
    }

    async componentDidMount() {
        setTimeout(() => {
            this.setState({
                msgVisible: true
            });
        }, 3000);

        // Check if there is a token or force in the local storage. If there isn't, return to login
        if (!localStorage.getItem("token") || !localStorage.getItem("force")) {
            this.setState({
                authorized: false
            });

            return;
        }

        // Since there's a token and force in local storage, check if the token is valid for that force
        const response = await make_request("/account/validateToken", "POST");

        // If the request returned status different of 200, the token isn't valid and the user should be redirected to login
        if (response.status !== 200) {
            this.setState({
                authorized: false
            });
            return
        }

        // Since the token is valid for the force, redirect the user to the requested page
        this.setState({
            authorized: true
        });
    }

    render() {
        if (this.state.authorized === undefined) {
            return (
                <h1 style={this.state.msgVisible ? {}: {display: "none"}}>A Autenticar... Por favor, aguarde</h1>
            );
        }

        return this.state.authorized ? <this.props.element /> : <Navigate to="/login"/>
    }
}

export default PrivateRoute;