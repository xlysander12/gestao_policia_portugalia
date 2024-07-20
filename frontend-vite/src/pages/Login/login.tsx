import React, {Component} from "react";
import style from "./login.module.css";
import {Navigate, useNavigate} from "react-router-dom";

function Login() {
    // Set the useNavigate hook
    const navigate = useNavigate()

    let nif = "";
    let password = "";

    const onLogin = async (event: SubmitEvent) => {
        // Prevent the page from reloading and reidireting by itself
        event.preventDefault();

        console.log("Logged in with NIF: " + nif + " and password: " + password);

        // Fecth the backend to check if the login was correct
        let response = await fetch("/portugalia/gestao_policia/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nif: nif,
                password: password
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

            navigate("/");
        }
    }


    return (
        <div className={style.outerLoginDiv}>
            <div className={style.innerLoginDiv}>
                {/*Login form*/}
                {/*@ts-ignore*/}
                <form onSubmit={onLogin}>

                    <input className={style.loginInput} type="text" pattern={"^[0-9]*$"} placeholder="NIF" onChange={(event) => nif = event.target.value} required/>

                    <input className={style.loginInput} type="password" placeholder="Senha" onChange={(event) => nif = event.target.value} required/>

                    <input className={style.loginInput} type="submit" value="Entrar"/>
                </form>
            </div>
        </div>
    );
}

export default Login;