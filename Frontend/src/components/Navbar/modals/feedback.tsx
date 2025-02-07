import Gate from "../../Gate/gate";
import {Modal, ModalSection} from "../../Modal";

import style from "./feedback.module.css";
import {DefaultButton, DefaultOutlinedTextField, DefaultTextField, DefaultTypography} from "../../DefaultComponents";
import {FormEvent, useEffect, useState} from "react";
import {Divider} from "@mui/material";
import {make_request} from "../../../utils/requests.ts";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/index.ts";
import {SubmitIssueRequestBodyType, SubmitSuggestionRequestBodyType} from "@portalseguranca/api-types/metrics/input";
import {toast} from "react-toastify";

type FeedbackModalProps = {
    type: "error" | "suggestion"
    code?: string
    open: boolean
    onClose: () => void
}
function FeedbackModal({type, code, open, onClose}: FeedbackModalProps) {
    const [errorCode, setErrorCode] = useState<string>(code ? code : "");
    const [title, setTitle] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    async function handleSubmit(event: FormEvent) {
        // Prevent the page from reloading
        event.preventDefault();

        // Decide the endpoint based on the type
        const endpoint = type === "error" ? "/metrics/issue" : "/metrics/suggestion";

        // Make the request
        const response = await make_request<SubmitIssueRequestBodyType | SubmitSuggestionRequestBodyType>(endpoint, "POST", {
           body: {
               code: errorCode,
               title: title,
               body: message
           },
            reloadOn500: false
        });

        // Get the data from the response
        const data: RequestSuccess | RequestError = await response.json();

        // If the request was successful, close the modal
        if (response.ok) {
            toast.success(data.message);

            // Revert the values to default
            setErrorCode(code ? code : "");
            setTitle("");
            setMessage("");

            onClose();
        }

        // If the request was not successful, show an error message
        else {
            toast.error(data.message);
        }
    }

    useEffect(() => {
        setErrorCode(code ? code : "");
        setTitle("");
        setMessage("");
    }, [type]);

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={type === "error" ? "Reportar um Erro" : "Enviar uma Sugestão"}
            >
                <form onSubmit={handleSubmit}>
                    <ModalSection title={"Dados"}>
                        <div className={style.main}>
                            <Gate show={type === "error"}>
                                <DefaultTypography
                                    fontWeight={"bold"}
                                    color={"var(--portalseguranca-color-accent)"}
                                >
                                    Código de erro:
                                </DefaultTypography>

                                <DefaultTextField
                                    value={errorCode}
                                    onChange={(e) => setErrorCode(e.target.value)}
                                />

                                <Divider sx={{margin: "10px 0"}}/>
                            </Gate>

                            <DefaultTypography
                                fontWeight={"bold"}
                                color={"var(--portalseguranca-color-accent)"}
                            >
                                Título {type === "error" ? "do erro" : "da sugestão"}:
                            </DefaultTypography>

                            <DefaultTextField
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />

                            <Divider sx={{margin: "10px 0"}}/>

                            <DefaultTypography
                                fontWeight={"bold"}
                                color={"var(--portalseguranca-color-accent)"}
                                sx={{marginBottom: "10px"}}
                            >
                                {type === "error" ? "Descrição do erro / Passos de reprodução:" : "Descrição da sugestão:"}
                            </DefaultTypography>

                            <DefaultOutlinedTextField
                                required
                                multiline
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </ModalSection>

                    <ModalSection title={"Ações"}>
                        <div className={style.actions}>
                            <DefaultButton
                                buttonColor={"lightgreen"}
                                type={"submit"}
                                sx={{flex: 1}}
                            >
                                {type === "error" ? "Reportar Erro" : "Enviar Sugestão"}
                            </DefaultButton>
                        </div>
                    </ModalSection>
                </form>
            </Modal>
        </>
    );
}

export default FeedbackModal;