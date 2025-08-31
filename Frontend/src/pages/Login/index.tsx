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

type LoginPageProps = {
    onLoginCallback: () => void
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

    // TODO: When logging in with discord, the "logged" toast doesn't appear and, sometimes, the page doesn't change (can't replicate consistently)
    const onLogin = async (event?: FormEvent<HTMLFormElement>, signal?: AbortSignal) => {
        // Disable page reload
        event?.preventDefault();

        // Set the loading state to true
        setLoading(true);

        // * Make the request to the server
        let loginResponse: Response;
        // If the discord login isn't being used, authenticate normally
        if (!searchParams.get("code")) {
            loginResponse = await make_request<LoginRequestBodyType>("/accounts/login", "POST", {
                body: {
                    nif: Number(nif),
                    password: password,
                    persistent: remember
                },
                redirectToLoginOn401: false,
                signal
            });
        } else { // If discord login is being used, make that request
            loginResponse = await make_request<LoginDiscordRequestBody>("/accounts/login/discord", "POST", {
                body: {
                    code: searchParams.get("code")!
                },
                redirectToLoginOn401: false,
                signal
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
        if (remember && !searchParams.get("code")) {
            localStorage.setItem("last_login", nif.toString());
        }

        // Disable the loading flag
        setLoading(false);

        // Clear all existing toasts
        toast.dismiss();

        // Show toast informing logic successful
        toast.success("Login realizado com sucesso. A redirecionar...");

        // Handle the login logic in the App core
        onLoginCallback();

        // Redirect the user to the desired page
        // If there's a redirect query param in the URL, redirect the user to that page
        if (searchParams.get("redirect")) {
            navigate(searchParams.get("redirect")!);
            return;
        }

        navigate("/");
    }

    useEffect(() => {
        const controller = new AbortController;
        const signal = controller.signal;

        if (searchParams.get("code") !== null) void onLogin(undefined, signal);

        return () => controller.abort();
    }, [searchParams.get("code")]);

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