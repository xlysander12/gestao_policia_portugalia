import React, {Component} from "react";
import Navbar from "../../components/Navbar/navbar";

class Dashboard extends Component {

    constructor(props) {
        super(props);

        // Initializing the state
        this.state = {
            nif: ""
        };

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