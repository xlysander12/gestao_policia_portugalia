import style from "./login.module.css";
import {useNavigate, useSearchParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    InputAdornment,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import {toast} from "react-toastify";
import {LoginRequestBodyType} from "@portalseguranca/api-types/account/input.ts";
import DiscordIcon from "../../components/DiscordIcon";
import {KeyOutlined, PermIdentityOutlined} from "@mui/icons-material";
import {useMutation} from "@tanstack/react-query";
import {login} from "@api/accounts.ts";

let isLoggingInDiscord = false;

type LoginPageProps = {
    onLoginCallback: (force: string) => void
}
function Login({onLoginCallback}: LoginPageProps) {
    // Set the useNavigate hook
    const navigate = useNavigate()

    // Get the search params on login
    const [searchParams] = useSearchParams();

    // Get the theme
    const theme = useTheme();

    // Set the state for the NIF and password
    const [nif, setNif] = useState<string>(localStorage.getItem("last_login") ? localStorage.getItem("last_login")! : "");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const loginMutation = useMutation({
        mutationFn: (body: LoginRequestBodyType) => login(body).queryfn(),

        onError: (error) => {
            toast(error.message, {type: "error"});
            setPassword("");
        },

        onSuccess: (response) => {
            // Set the first force in the local storage
            localStorage.setItem("force", response.data.forces[0]);

            // Handle the login logic in the App core
            onLoginCallback(response.data.forces[0]);

            // Clear all existing toasts
            toast.dismiss();

            // Show toast informing logic successful
            toast.success("Login realizado com sucesso. A redirecionar...");

            // Redirect
            redirectAfterLogin();
        }
    });

    // State for discord login
    const [discordLoginAccepted, setDiscordLoginAccepted] = useState(sessionStorage.getItem("discord_login") === "true");

    function redirectAfterLogin() {
        // Ensure discord login session param is cleared
        sessionStorage.removeItem("discord_login");

        // If there's a redirect query param in the URL, redirect the user to that page
        if (searchParams.get("redirect")) {
            void navigate(searchParams.get("redirect")!);
            return;
        }

        void navigate("/");
    }


    // Start login process immediately if the code search param is present and the process hasn't started yet
    // TODO: Separated page to authenticate using discord
    const code = searchParams.get("code");
    useEffect(() => {
        if (code && !isLoggingInDiscord) {
            isLoggingInDiscord = true;
        }
    }, [code, isLoggingInDiscord]);

    // Use effect to redirect the user after login when the discordLoginAccepted state changes to true
    useEffect(() => {
        if (discordLoginAccepted) {
            redirectAfterLogin();
        }
    }, [discordLoginAccepted, redirectAfterLogin]);

    return (
        <div className={style.outerLoginDiv}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();

                    loginMutation.mutate({
                        nif: parseInt(nif),
                        password,
                        persistent: remember
                    });
                }}
                style={{height: "100%"}}
            >
                <div className={style.innerLoginDiv}>
                    <Typography
                        color={"textPrimary"}
                        variant={"h2"}
                        sx={{
                            fontWeight: "bold",
                            position: "relative",
                            top: "-8%",
                            alignSelf: "center"
                        }}
                    >
                        Portal Segurança
                    </Typography>


                    <TextField
                        variant={"outlined"}
                        fullWidth
                        placeholder={"NIF"}
                        type={"text"}
                        onChange={(event) => setNif(event.target.value)}
                        required
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position={"start"}>
                                        <PermIdentityOutlined color={"disabled"}/>
                                    </InputAdornment>
                                )
                            },
                            htmlInput: {
                                pattern: "^[0-9]*$"
                            }
                        }}
                        value={nif}
                        disabled={loginMutation.isPending}
                    />

                    <TextField
                        variant={"outlined"}
                        fullWidth
                        placeholder={"Password"}
                        type={"password"}
                        autoComplete={"current-password"}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position={"start"}>
                                        <KeyOutlined color={"disabled"}/>
                                    </InputAdornment>
                                )
                            }
                        }}
                        value={password}
                        disabled={loginMutation.isPending}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={remember}
                                onChange={(event) => setRemember(event.target.checked)}
                            />}
                        label={"Lembrar neste computador"}
                        slotProps={{
                            typography: {
                                color: "textSecondary"
                            }
                        }}
                        sx={{
                            margin: "-10px"
                        }}
                        disabled={loginMutation.isPending}
                    />

                    <Button
                        variant={"contained"}
                        fullWidth
                        type={"submit"}
                        disabled={loginMutation.isPending}
                        sx={{
                            color: "#fff"
                        }}
                    >
                        Entrar
                    </Button>

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
                            color: "#fff",

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