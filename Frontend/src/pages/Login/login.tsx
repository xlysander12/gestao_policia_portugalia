import style from "./login.module.css";
import {useNavigate} from "react-router-dom";
import {DefaultButton, DefaultOutlinedTextField} from "../../components/DefaultComponents";
import React, {useState} from "react";
import {Checkbox, FormControlLabel} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import { LoginRequestBodyType } from "@portalseguranca/api-types/account/input.ts";

function Login() {
    // Set the useNavigate hook
    const navigate = useNavigate()

    // Set the state for the loading
    const [loading, setLoading] = useState<boolean>(false);

    // Set the state for the NIF and password
    const [nif, setNif] = useState<string>(localStorage.getItem("last_login") ? localStorage.getItem("last_login")! : "");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const onLogin = async (event: any) => {
        // Prevent the page from reloading and reidireting by itself
        event.preventDefault();

        // Set the loading state to true
        setLoading(true);

        // Check if the credentials are correct
        let loginResponse = await make_request<LoginRequestBodyType>("/accounts/login", "POST", {
            body: {
                nif: Number(nif),
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
            setPassword("");
            setLoading(false);
            return;
        }

        // * If the request returned status 200, the login was successful
        // Set the first force in the local storage
        localStorage.setItem("force", loginJson.data.forces[0]);

        // Set the flag in localStorage to indicate that the page needs to reload
        localStorage.setItem("needsReload", "true");

        // Set the last_login nif in the local storage if the remind be checkbox is checked
        if (remember) {
            localStorage.setItem("last_login", nif.toString());
        }

        // ! Since the token should now be stored in cookies, there's no need to store it in the local storage
        // Disable the loading flag
        setLoading(false);

        // Redirect the user to the home page
        navigate("/");
    }

    return (
        <div className={style.outerLoginDiv}>
            <form onSubmit={onLogin}>
                <div className={style.innerLoginDiv}>
                    {/*Login form*/}

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
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                    />

                    <DefaultButton
                        fullWidth
                        type={"submit"}
                        disabled={loading}
                    >Entrar</DefaultButton>
            </div>
        </form>
</div>
)
    ;
}

export default Login;