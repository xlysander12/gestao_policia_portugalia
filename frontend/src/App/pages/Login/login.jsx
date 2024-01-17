import React, {Component} from "react";
import style from "./login.module.css";
import Navbar from "../../components/Navbar/navbar";

class Login extends Component {
    constructor(props) {
        super(props);

        this.onLogin = this.onLogin.bind(this);
    }

    async onLogin(event) {
        // Prevent the page from realoading and reidireting by itself
        event.preventDefault();

        console.log("Logged in with NIF: " + event.target.nif.value + " and password: " + event.target.password.value);

        // Fecth the backend to check if the login was correct
        let response = await fetch("/portugalia/gestao_policia/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: event.target.nif.value,
                password: event.target.password.value
            })
        });

        console.log(response);

        // If the request returned status 401, the username doens't exist or password is wrong
        if (response.status === 401) {
            alert("NIF ou senha incorretos!");
            return;
        }

        // If the request returned status 200, the login was successful
        if (response.status === 200) {
            // Get the response body
            let body = await response.text(); // TODO This will soon be a JSON object

            // Save the token in the local storage
            localStorage.setItem("token", body);

            // Redirect to the main page
            window.location.href = "/";
        }
    }

    render() {
        return (
            <div>
                {/*Adding the navbar to the page*/}
                <Navbar path={[["Login", ""]]}/>

                {/*Creating the login div*/}
                <div className={style.outerLoginDiv}>
                    <div className={style.innerLoginDiv}>
                        {/*Login form*/}
                        <form onSubmit={this.onLogin}>

                            <input type="text" name="nif" pattern={"^[0-9]*$"} placeholder="NIF" required/>

                            <input type="password" name="password" placeholder="Senha" required/>

                            <input type="submit" value="Entrar"/>
                        </form>
                    </div>
                </div>

            </div>
        );
    }
}

export default Login;