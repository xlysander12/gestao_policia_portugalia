import React, {Component} from "react";
import "./login.module.css";

function str() {
    return "Hello";

}

class Login extends Component {
    render() {
        return (
            <div>
                <h1>{str()}</h1>
            </div>
        );
    }
}

export default Login;