import {Modal, ModalSection} from "../../Modal";
import React, {useContext, useState} from "react";
import {LoggedUserContext} from "../../PrivateRoute/logged-user-context.ts";
import {FormControlLabel, Switch} from "@mui/material";
import {make_request} from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import { ChangeAccountInfoRequestBodyType } from "@portalseguranca/api-types/account/input.ts";
import { BaseResponse } from "@portalseguranca/api-types";

type AuthenticationMethodsModalProps = {
    open: boolean
    onClose: () => void
}
function AuthenticationMethodsModal(props: AuthenticationMethodsModalProps) {
    // Get logged user's account data from context
    const loggedUser = useContext(LoggedUserContext);

    // Loading state
    const [loading, setLoading] = useState<boolean>(false);

    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={"Métodos de Autenticação"}
        >
            <ModalSection title={"Autenticação"}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start"
                    }}
                >
                    <FormControlLabel
                        label={"Autenticação via Palavra-Passe"}
                        disabled={loading || !loggedUser.authentication.discord}
                        control={
                            <Switch
                                checked={loggedUser.authentication.password}
                                onChange={async (event) => {
                                    // Set loading to true
                                    setLoading(true);

                                    // Make request to backend
                                    const response = await make_request<ChangeAccountInfoRequestBodyType>(`/accounts/${loggedUser.info.personal.nif}`, "PATCH", {
                                        body: {
                                            password_login: event.target.checked
                                        }
                                    });
                                    const responseJson = await response.json() as BaseResponse;

                                    if (!response.ok) {
                                        toast.error(responseJson.message);
                                    } else {
                                        toast.success("Definições alteradas com sucesso. Pode demorar alguns segundos até que as alterações sejam visíveis.");
                                    }

                                    setLoading(false);
                                }}
                            />
                        }
                    />
                    <FormControlLabel
                        label={"Autenticação via Discord"}
                        disabled={loading || !loggedUser.authentication.password}
                        control={
                            <Switch
                                checked={loggedUser.authentication.discord}
                                onChange={async (event) => {
                                    // Set loading to true
                                    setLoading(true);

                                    // Make request to backend
                                    const response = await make_request<ChangeAccountInfoRequestBodyType>(`/accounts/${loggedUser.info.personal.nif}`, "PATCH", {
                                        body: {
                                            discord_login: event.target.checked
                                        }
                                    });
                                    const responseJson = await response.json() as BaseResponse;

                                    if (!response.ok) {
                                        toast.error(responseJson.message);
                                    } else {
                                        toast.success("Definições alteradas com sucesso. Pode demorar alguns segundos até que as alterações sejam visíveis.");
                                    }

                                    setLoading(false);
                                }}
                            />
                        }
                    />
                </div>
            </ModalSection>
        </Modal>
    );
}

export default AuthenticationMethodsModal;