import React, {Component} from "react";
import style from "./login.module.css";
import Navbar from "../../components/Navbar/navbar";
import {Navigate} from "react-router-dom";

class Login extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loggedOn: false
        }

        this.onLogin = this.onLogin.bind(this);
    }

    async onLogin(event) {
        // Prevent the page from reloading and reidireting by itself
        event.preventDefault();

        console.log("Logged in with NIF: " + event.target.nif.value + " and password: " + event.target.password.value);

        // Fecth the backend to check if the login was correct
        let response = await fetch("/portugalia/gestao_policia/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nif: event.target.nif.value,
                password: event.target.password.value
            })
        });

        // If the request returned status 401, the username doesn't exist or password is wrong
        if (response.status === 401) {
            alert((await response.json()).message);
            return;
        }

        // If the request returned status 200, the login was successful
        if (response.status === 200) {
            // Get the response body
            let body = await response.json();

            // Save the token in the local storage
            localStorage.setItem("token", body.data);

            // Set the state to loggedOn
            this.setState({
                loggedOn: true
            })
        }
    }

    render() {
        if (this.state.loggedOn) {
            return (<Navigate to={"/"} />)
        }

        return (
            <div>
                {/*Adding the navbar to the page*/}
                <Navbar path={[["Login", ""]]}/>

                {/*Creating the login div*/}
                <div className={style.outerLoginDiv}>
                    <div className={style.innerLoginDiv}>
                        {/*Login form*/}
                        <form onSubmit={this.onLogin}>

                            <input className={style.loginInput} type="text" name="nif" pattern={"^[0-9]*$"} placeholder="NIF" required/>

                            <input className={style.loginInput} type="password" name="password" placeholder="Senha" required/>

                            <input className={style.loginInput} type="submit" value="Entrar"/>
                        </form>
                    </div>
                </div>

            </div>
        );
    }
}

export default Login;