import style from "./login.module.css";
import {useNavigate} from "react-router-dom";
import {DefaultButton, DefaultOutlinedTextField} from "../../components/DefaultComponents/default-components.tsx";
import React, {useState} from "react";
import {Checkbox, FormControlLabel} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";

function Login() {
    // Set the useNavigate hook
    const navigate = useNavigate()

    // Set the state for the NIF and password
    const [nif, setNif] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const onLogin = async (event: any) => {
        // Prevent the page from reloading and reidireting by itself
        event.preventDefault();

        // Check if the credentials are correct
        let loginResponse = await make_request("/accounts/login", "POST", {
            body: {
                nif: nif,
                password: password,
                persistent: remember
            },
            redirectToLoginOn401: false
        });

        // Get the data from the response
        let loginJson = await loginResponse.json();

        // If the request didn't return a 200 code, the login was unsuccessful
        if (!loginResponse.ok) {
            toast(loginJson.message, {type: "error"});
            return;
        }

        // * If the request returned status 200, the login was successful
        // Set the first force in the local storage
        localStorage.setItem("force", loginJson.data.forces[0]);

        // Set the flag in localStorage to indicate that the page needs to reload
        localStorage.setItem("needsReload", "true");

        // ! Since the token should now be stored in cookies, there's no need to store it in the local storage
        navigate("/");
    }

    return (
        <div className={style.outerLoginDiv}>
            <form onSubmit={onLogin}>
                <div className={style.innerLoginDiv}>
                    {/*Login form*/}
                    {/*@ts-ignore*/}


                    <DefaultOutlinedTextField
                        alternateColor
                        fullWidth
                        size={"small"}
                        label={"NIF"}
                        type={"text"}
                        onChange={(event) => setNif(event.target.value)}
                        required
                        inputProps={{
                            pattern: "^[0-9]*$"
                        }}
                        value={nif}
                    />

                    <DefaultOutlinedTextField
                        alternateColor
                        fullWidth
                        size={"small"}
                        label={"Password"}
                        type={"password"}
                        onChange={(event) => setPassword(event.target.value)}
                        value={password}
                        required
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={remember}
                                onChange={(event) => setRemember(event.target.checked)}
                                sx={{
                                    "&.MuiButtonBase-root.MuiCheckbox-root": {
                                        color: "var(--portalseguranca-color-text-light)",

                                        "&.Mui-checked": {
                                            color: "var(--portalseguranca-color-accent)"
                                        }
                                    }
                                }}
                            />}
                        label={"Lembrar neste computador"}
                        slotProps={{
                            typography: {
                                color: "textPrimary"
                            }
                        }}
                        sx={{
                            margin: "-10px"
                        }}
                    />

                    <DefaultButton
                        fullWidth
                        type={"submit"}
                    >Entrar</DefaultButton>
            </div>
        </form>
</div>
)
    ;
}

export default Login;