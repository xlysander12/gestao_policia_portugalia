import React, {Component} from "react";
import Navbar from "../../components/Navbar/navbar";

class Dashboard extends Component {

    constructor(props) {
        super(props);

        // Initializing the state
        this.state = {
            nif: ""
        };


        // Checking if there is a token in the local storage
        if (!localStorage.getItem("token")) {
            // Redirect to the login page
            window.location.href = "/login";
        }

    }

    async componentDidMount() {
        // Checking if the token is valid
        let response = await fetch("/portugalia/gestao_policia/api/validateToken", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            }
        });

        // If the request returned status different that 200, the token is invalid
        if (response.status !== 200) {
            // Remove the token from the local storage
            localStorage.removeItem("token");

            // Redirect to the login page
            window.location.href = "/login";
            return;
        }

        // If the request returned status 200, the token is valid
        let body = await response.json();
        console.log("Updating the dashboard's state nif to " + body.data);
        this.setState({
            nif: body.data
        });
    }

    render() {
        return (
            <div>
                <Navbar />
                <h1>Dashboard</h1>
            </div>
        );
    }
}

export default Dashboard;