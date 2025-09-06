import style from "./login.module.css";
import {useNavigate, useSearchParams} from "react-router-dom";
import {DefaultButton, DefaultOutlinedTextField} from "../../components/DefaultComponents";
import React, {FormEvent, useEffect, useState} from "react";
import {Button, Checkbox, Divider, FormControlLabel} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import {LoginDiscordRequestBody, LoginRequestBodyType} from "@portalseguranca/api-types/account/input.ts";
import { LoginResponse } from "@portalseguranca/api-types/account/output";
import DiscordIcon from "../../components/DiscordIcon";

let isLoggingInDiscord = false;

type LoginPageProps = {
    onLoginCallback: (force: string) => void
}
function Login({onLoginCallback}: LoginPageProps) {
    // Set the useNavigate hook
    const navigate = useNavigate()

    // Get the search params on login
    const [searchParams] = useSearchParams();

    // Set the state for the loading
    const [loading, setLoading] = useState<boolean>(false);

    // Set the state for the NIF and password
    const [nif, setNif] = useState<string>(localStorage.getItem("last_login") ? localStorage.getItem("last_login")! : "");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    // State for discord login
    const [discordLoginAccepted, setDiscordLoginAccepted] = useState(sessionStorage.getItem("discord_login") === "true");

    function redirectAfterLogin() {
        // Ensure discord login session param is cleared
        sessionStorage.removeItem("discord_login");

        // If there's a redirect query param in the URL, redirect the user to that page
        if (searchParams.get("redirect")) {
            navigate(searchParams.get("redirect")!);
            return;
        }

        navigate("/");
    }

    const onLogin = async (event?: FormEvent<HTMLFormElement>, discord?: boolean) => {
        // Disable page reload
        event?.preventDefault();

        // Set the loading state to true
        setLoading(true);

        // * Make the request to the server
        let loginResponse: Response;
        // If the discord login isn't being used, authenticate normally
        if (!discord) {
            loginResponse = await make_request<LoginRequestBodyType>("/accounts/login", "POST", {
                body: {
                    nif: Number(nif),
                    password: password,
                    persistent: remember
                },
                redirectToLoginOn401: false
            });
        } else { // If discord login is being used, make that request
            loginResponse = await make_request<LoginDiscordRequestBody>("/accounts/login/discord", "POST", {
                body: {
                    code: searchParams.get("code")!
                },
                redirectToLoginOn401: false
            });
        }

        // Get the data from the response
        const loginJson = await loginResponse.json() as LoginResponse;

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

        // Set the last_login nif in the local storage if the remind be checkbox is checked and the login wasn't with discord
        if (!discord) {
            localStorage.setItem("last_login", nif.toString());
        }

        // Handle the login logic in the App core
        onLoginCallback(loginJson.data.forces[0]);

        // Clear all existing toasts
        toast.dismiss();

        // Show toast informing logic successful
        toast.success("Login realizado com sucesso. A redirecionar...");

        // Redirect the user to the desired page
        // ! Only make this this way if not authenticating with discord -- Otherwise, use the useEffect below
        if (!discord) redirectAfterLogin()
        else {
            // Set the state of discord login to accepted
            setDiscordLoginAccepted(true);
            sessionStorage.setItem("discord_login", "true");
        }
    }

    // Start login process immediately if the code search param is present and the process hasn't started yet
    const code = searchParams.get("code");
    useEffect(() => {
        if (code && !isLoggingInDiscord) {
            isLoggingInDiscord = true;
            void onLogin(undefined, true);
        }
    }, [code, isLoggingInDiscord]);

    // Use effect to redirect the user after login when the discordLoginAccepted state changes to true
    useEffect(() => {
        if (discordLoginAccepted) {
            redirectAfterLogin();
        }
    }, [discordLoginAccepted]);

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
                        label={"Palavra-Passe"}
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
                    >
                        Entrar
                    </DefaultButton>

                    <Divider flexItem/>

                    <Button
                        fullWidth
                        disableRipple
                        variant={"contained"}
                        startIcon={
                            <DiscordIcon sx={{fontSize: "30px"}}/>
                        }
                        sx={{
                            backgroundColor: "#5865f2",

                            "&:hover": {
                                backgroundColor: "#5865f2",
                                opacity: 0.7
                            }
                        }}
                        onClick={() => {
                            window.location.href = `https://discord.com/oauth2/authorize?client_id=1398775040983695400&response_type=code&redirect_uri=${encodeURIComponent(window.location.href.split("?")[0])}&scope=identify`
                        }}
                    >
                        Entrar com Discord
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default Login;