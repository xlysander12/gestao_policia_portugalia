import {Navigate} from "react-router-dom";
import {Component} from "react";


class PrivateRoute extends Component {

    constructor(props) {
        super(props);

        this.state = {
            authorized: undefined,

            msgVisible: false
        }

        setTimeout(() => {
            this.setState({
                msgVisible: true
            });
        }, 3000);
    }

    async componentDidMount() {
        // Check if there is a token in the local storage. If there isn't, return to login
        if (!localStorage.getItem("token")) {
            this.setState({
                authorized: false
            });

            return;
        }

        // Check if there is a force stored in the local storage
        if (!localStorage.getItem("force")) {
            this.setState({
                authorized: false
            });

            return;
        }

        // Since there's a force in local storage, check if the token is valid for that force
        const response = await fetch("/portugalia/gestao_policia/api/validateToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-PortalSeguranca-Force": localStorage.getItem("force")
            }
        });

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