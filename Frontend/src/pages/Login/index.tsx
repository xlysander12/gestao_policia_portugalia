import style from "./login.module.css";
import {useNavigate, useSearchParams} from "react-router-dom";
import React, {useCallback} from "react";
import {
    Button,
    Checkbox,
    Divider,
    FormControlLabel,
    InputAdornment,
    TextField,
    Typography
} from "@mui/material";
import {toast} from "react-toastify";
import {LoginRequestBodyType} from "@portalseguranca/api-types/account/input.ts";
import DiscordIcon from "../../components/DiscordIcon";
import {KeyOutlined, PermIdentityOutlined} from "@mui/icons-material";
import {useMutation} from "@tanstack/react-query";
import {useForm} from "@tanstack/react-form";
import {login} from "@api/accounts.ts";

type LoginPageProps = {
    onLoginCallback: (force: string) => void
}
function Login({onLoginCallback}: LoginPageProps) {
    // Set the useNavigate hook
    const navigate = useNavigate()

    // Get the search params on login
    const [searchParams] = useSearchParams();

    // Create the form instance
    const loginForm = useForm({
        defaultValues: {
            nif: localStorage.getItem("last_login") ? localStorage.getItem("last_login") : "",
            password: "",
            remember: false
        },
        onSubmit: (data) => {
            loginMutation.mutate({
                nif: parseInt(data.value.nif!),
                password: data.value.password,
                persistent: data.value.remember
            });
        }
    });

    const loginMutation = useMutation({
        mutationFn: (body: LoginRequestBodyType) => login(body).queryfn(),

        onError: (error) => {
            toast(error.message, {type: "error"});
            loginForm.resetField("password");
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

    const redirectUrl = searchParams.get("redirect") || null;
    const redirectAfterLogin= useCallback(() => {
        // If there's a redirect query param in the URL, redirect the user to that page
        if (redirectUrl !== null) {
            void navigate(redirectUrl);
            return;
        }

        void navigate("/");
    }, [redirectUrl, navigate]);

    // TODO: Separated page to authenticate using discord

    return (
        <div className={style.outerLoginDiv}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void loginForm.handleSubmit();
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


                    <loginForm.Field
                        name={"nif"}
                        validators={{
                            onChange: (data) => {
                                console.log()

                                if (!data.value)
                                    return "O NIF é obrigatório"

                                const converted = parseInt(data.value);

                                // Ensure the value is a number and not a string
                                if (isNaN(converted))
                                    return "O NIF deve ser um número.";

                                // Ensure the value is a positive number
                                if (converted < 0)
                                    return "O NIF deve ser um número positivo.";

                                // Ensure the value has between 7 and 9 digits
                                if (data.value.length < 7 || data.value.length > 9)
                                    return "O NIF deve ter entre 7 e 9 dígitos.";
                            }
                        }}
                    >
                        {(field) => (
                            <TextField
                                id={field.name}
                                name={field.name}
                                variant={"outlined"}
                                fullWidth
                                placeholder={"NIF"}
                                type={"text"}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                required
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position={"start"}>
                                                <PermIdentityOutlined color={"disabled"}/>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                value={field.state.value}
                                disabled={loginMutation.isPending}
                            />
                        )}
                    </loginForm.Field>

                    <loginForm.Field
                        name={"password"}
                        validators={{
                            onChange: (data) => {
                                if (!data.value)
                                    return "A password é obrigatória"
                            }
                        }}
                    >
                        {(field) => (
                            <TextField
                                id={field.name}
                                name={field.name}
                                variant={"outlined"}
                                fullWidth
                                placeholder={"Password"}
                                type={"password"}
                                autoComplete={"current-password"}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
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
                                value={field.state.value}
                                disabled={loginMutation.isPending}
                            />
                        )}
                    </loginForm.Field>

                    <loginForm.Field name={"remember"}>
                        {(field) => (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        id={field.name}
                                        name={field.name}
                                        checked={field.state.value}
                                        onChange={(event) => field.handleChange(event.target.checked)}
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
                        )}
                    </loginForm.Field>

                    <loginForm.Subscribe
                        selector={state => [state.canSubmit]}
                    >
                        {([canSubmit]) => (
                            <Button
                                variant={"contained"}
                                fullWidth
                                type={"submit"}
                                disabled={loginMutation.isPending || !canSubmit}
                                sx={{
                                    color: "#fff"
                                }}
                            >
                                Entrar
                            </Button>
                        )}
                    </loginForm.Subscribe>

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