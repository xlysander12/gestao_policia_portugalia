import Gate from "../../Gate/gate";
import {Modal, ModalSection} from "../../Modal";

import style from "./feedback.module.css";
import {DefaultButton, DefaultOutlinedTextField, DefaultTextField, DefaultTypography} from "../../DefaultComponents";
import {FormEvent, useEffect, useState} from "react";
import {Autocomplete, AutocompleteRenderInputParams, Divider} from "@mui/material";
import {make_request} from "../../../utils/requests.ts";
import {RequestError, BaseResponse} from "@portalseguranca/api-types/index.ts";
import {SubmitIssueRequestBodyType, SubmitSuggestionRequestBodyType} from "@portalseguranca/api-types/metrics/input";
import {toast} from "react-toastify";
import {UserError, UtilUserErrorsResponse} from "@portalseguranca/api-types/util/output";
import moment, {Moment} from "moment";

type InnerUserError = Omit<UserError, "timestamp"> & {
    timestamp: Moment
}

type FeedbackModalProps = {
    type: "error" | "suggestion"
    open: boolean
    onClose: () => void
}

function FeedbackModal({type, open, onClose}: FeedbackModalProps) {
    const [errorCode, setErrorCode] = useState<InnerUserError>({code: "", timestamp: moment()});
    const [title, setTitle] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);
    const [fetchedCodes, setFetchedCodes] = useState<InnerUserError[]>([]);

    async function fetchErrorCodes() {
        // Set the loading flag to true
        setLoading(true);

        // Fetch the errors from the API
        const response = await make_request("/util/errors", "GET", {
            errorPageOn500: false
        });
        const responseJson: UtilUserErrorsResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            setFetchedCodes([]);
            return;
        }

        // Apply the data from the response to state
        setFetchedCodes(responseJson.data.map(error => ({
            ...error,
            timestamp: moment.unix(error.timestamp)
        })).sort((a, b) => {
            return b.timestamp.diff(a.timestamp);
        }));

        // Set the loading flag to false
        setLoading(false);
    }

    async function handleSubmit(event: FormEvent) {
        // Prevent the page from reloading
        event.preventDefault();

        // Decide the endpoint based on the type
        const endpoint = type === "error" ? "/metrics/issue" : "/metrics/suggestion";

        // Make the request
        const response = await make_request<SubmitIssueRequestBodyType | SubmitSuggestionRequestBodyType>(endpoint, "POST", {
            body: {
                code: errorCode.code !== "" ? errorCode.code: undefined,
                title: title,
                body: message
            },
            errorPageOn500: false
        });

        // Get the data from the response
        const data: BaseResponse | RequestError = await response.json();

        // If the request was successful, close the modal
        if (response.ok) {
            toast.success(data.message);

            // Revert the values to default
            setErrorCode({code: "", timestamp: moment()});
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
        setErrorCode({code: "", timestamp: moment()});
        setTitle("");
        setMessage("");
        setFetchedCodes([]);

        // If the type is error, fetch the error codes from the user
        if (open && type === "error") {
            fetchErrorCodes();
        }
    }, [type, open]);


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
                                    Código de erro (opcional):
                                </DefaultTypography>

                                <Autocomplete
                                    freeSolo
                                    options={fetchedCodes}
                                    loading={loading}
                                    loadingText={"A carregar códigos..."}
                                    noOptionsText={"Nenhum código encontrado"}
                                    value={errorCode}
                                    onChange={(_, value) => {
                                        setErrorCode((value as InnerUserError))
                                    }}
                                    getOptionLabel={(option) => {
                                        if ((option as InnerUserError).code === "") {
                                            return "";
                                        }

                                        return `${(option as InnerUserError).code} - ${(option as InnerUserError).timestamp.calendar()}`
                                    }}
                                    getOptionKey={(option) => {
                                        return (option as InnerUserError).code;
                                    }}
                                    renderInput={(params: AutocompleteRenderInputParams) => {
                                        return (
                                            <DefaultTextField {...params}/>
                                        );
                                    }}
                                    slotProps={{
                                        popper: {
                                            sx: {
                                                "& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading": {
                                                    color: "var(--portalseguranca-color-text-light)"
                                                }
                                            }
                                        }
                                    }}
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