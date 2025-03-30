import React, {ReactElement, useContext, useEffect, useState} from "react";
import {useImmer} from "use-immer";
import {make_request} from "../../../utils/requests.ts";
import {Loader} from "../../../components/Loader";
import modalsStyle from "./officerinfomodals.module.css";
import {FormControlLabel, Stack, Switch, Typography} from "@mui/material";
import {DefaultButton} from "../../../components/DefaultComponents";
import {ConfirmationDialog, Modal, ModalSection} from "../../../components/Modal";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import {AccountInfo, AccountInfoResponse} from "@portalseguranca/api-types/account/output";
import {LoggedUserContext, LoggedUserContextType} from "../../../components/PrivateRoute/logged-user-context.ts";
import {RequestError, BaseResponse} from "@portalseguranca/api-types/index.ts";
import {toast} from "react-toastify";
import Gate from "../../../components/Gate/gate.tsx";
import { ChangeAccountInfoRequestBodyType } from "@portalseguranca/api-types/account/input.ts";
import {useForceData} from "../../../hooks";
import moment, {Moment} from "moment";

type InnerAcountInfo = Omit<AccountInfo, "lastUsed"> & {
    lastUsed: Moment | null
}

type AccountInformationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: number,
    officerFullName: string
}

function AccountInformationModal({open, onClose, officerNif, officerFullName}: AccountInformationModalProps) {
    // Getting the force's data from the context
    const [forceData] = useForceData();

    // Getting the logged user data from the context
    const loggedUserData = useContext<LoggedUserContextType>(LoggedUserContext);

    const [accountExists, setAccountExists] = useState<boolean | null>(null);

    // Initialize the state that contains the officer's account information
    // // Create an object with all intents and set them to false
    const intentsObject: {[key: string]: boolean} = {};
    for (const intent of forceData.intents) {
        intentsObject[intent.name] = false;
    }

    const [accountInfo, setAccountInfo] = useImmer<InnerAcountInfo>({
        defaultPassword: false,
        suspended: false,
        lastUsed: null,
        intents: intentsObject
    });

    // State for managing the refresh of the account information
    const [needsRefresh, setNeedsRefresh] = useState(true);
    const [justRefreshed, setJustRefreshed] = useState(false);

    // State for the confirmation dialog for account deletion and password reset
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [resetPasswordConfirmationOpen, setResetPasswordConfirmationOpen] = useState(false);

    // State for managing the loading
    const [loading, setLoading] = useState(false);

    // * If loading is true and the modal is open, change the cursor to "waiting"
    if (loading && open) {
        document.body.style.cursor = "wait";
    } else {
        document.body.style.cursor = "default";
    }

    // Fetch the current information about the officer
    useEffect(() => {
        async function fetchAccountInfo() {
            // Make the request to get the account information
            const accountInfoResponse = await make_request(`/accounts/${officerNif}`, "GET");

            // Check if the response is ok
            if (accountInfoResponse.status === 404) {
                setAccountExists(false);

                // Disable loading if enabled
                if (loading)
                    setLoading(false);

                return;
            }

            // If the response code is 403, the logged user doesn't have permission to see the account information
            if (accountInfoResponse.status === 403) {
                return;
            }

            // Convert the response to JSON and set the account info state
            const accountInfoJson: AccountInfoResponse = await accountInfoResponse.json();
            setAccountInfo(draft => {
                draft.defaultPassword = accountInfoJson.data.defaultPassword;
                draft.suspended = accountInfoJson.data.suspended;
                draft.lastUsed = accountInfoJson.data.lastUsed ? moment.unix(accountInfoJson.data.lastUsed): null;
                draft.intents = accountInfoJson.data.intents;
            });

            setAccountExists(true);

            // Disable loading if enabled
            if (loading)
                setLoading(false);
        }

        // Fetch the account information if it didn't just refresh
        if (!justRefreshed) {
            fetchAccountInfo();
        }

        // Make sure setJustRefreshed is set to false before advancing
        setJustRefreshed(false);

        // If the need to refresh is present, set it to false and set justRefreshed to true to avoid a loop
        if (needsRefresh) {
            setNeedsRefresh(false);
            setJustRefreshed(true);
        }

    }, [officerNif, needsRefresh]);

    // Function to create an account if it doesn't exist
    async function createAccount() {
        // Set the loading state to true
        setLoading(true);

        const response = await make_request(`/accounts/${officerNif}`, "POST");
        if (!response.ok) {
            return toast(`Erro ao ativar a conta:\n${((await response.json()) as BaseResponse).message}`, {type: "error"});
        }
        toast("Conta ativada com sucesso", {type: "success"});
        setNeedsRefresh(true);

        // Disable loading
        setLoading(false);
    }

    // Function to change the suspended state of an account
    async function changeSuspendedState(suspend: boolean) {
        // Set the loading state to true
        setLoading(true);

        // Make the request to change the suspended state
        const response = await make_request<ChangeAccountInfoRequestBodyType>(`/accounts/${officerNif}`, "PATCH", {
            body: {
                suspended: suspend
            }
        });

        // If the response wasn't OK, somthing went wrong (prob won't happen very often)
        if (!response.ok) {
            return toast(`Erro ao ${suspend ? 'suspender': 'reativar'} a conta:\n${((await response.json()) as RequestError).message}`, {type: "error"});
        }

        // Inform the successfull change
        toast(`Conta ${suspend ? 'suspensa': 'reativada'} com sucesso`, {type: suspend ? "warning": "success"});

        // Make the information refresh to reflext the changes and change the manage buttons
        setNeedsRefresh(true);

        // ! Loading will be disabled by the refresh
    }

    let lastUsedString;
    if (accountInfo.lastUsed === null) {
        lastUsedString = "Nunca utilizada";
    } else {
        lastUsedString = accountInfo.lastUsed.format("DD/MM/YYYY @ HH:mm");
    }

    let modalContent: ReactElement;

    if (accountExists === null) {
        modalContent = (
            <Loader size={"100px"}/>
        );
    } else if (!accountExists) {
        modalContent = (
            <div className={modalsStyle.noAccountDiv}>
                <Typography color={"var(--portalseguranca-color-text-light)"}>Este efetivo não tem a conta ativada.<br/>Ativar a conta vai permitir o login com este nif e a palavra-passe padrão</Typography>
                <DefaultButton
                    darkTextOnHover
                    onClick={createAccount}
                    disabled={loading}
                    sx={{
                        marginTop: "10px"
                    }}
                >
                    Ativar Conta
                </DefaultButton>
            </div>
        );
    } else {
        modalContent = (
            <>
                <ModalSection title={"Informações Gerais"}>
                    <div className={modalsStyle.informationInnerSectionDiv}>
                        <Stack alignItems={"center"} direction={"row"} gap={0.5}>
                            <Typography>Palavra-passe alterada:</Typography>
                            {!accountInfo.defaultPassword ? <CheckCircleOutlinedIcon sx={{color: "green"}}/> : <CancelOutlinedIcon sx={{color: "red"}}/>}
                        </Stack>

                        <Stack alignItems={"center"} direction={"row"} gap={0.5}>
                            <Typography>Conta ativa:</Typography>
                            {!accountInfo.suspended ? <CheckCircleOutlinedIcon sx={{color: "green"}}/> : <CancelOutlinedIcon sx={{color: "red"}}/>}
                        </Stack>

                        <Typography>Última utilização: {lastUsedString}</Typography>
                    </div>
                </ModalSection>

                <ModalSection title={"Permissões"}>
                    <div className={modalsStyle.informationInnerSectionDiv}>
                        {forceData.intents.map((intent) => {
                            return (
                                <FormControlLabel
                                    key={`intent-${intent.name}`}
                                    disabled={loading || !loggedUserData.intents[intent.name]}
                                    control={
                                        <Switch
                                            checked={accountInfo.intents[intent.name]}
                                            onChange={async (event) => {
                                                // Set the loading state to true
                                                setLoading(true);

                                                setAccountInfo(draft => {
                                                    draft.intents[intent.name] = event.target.checked;
                                                });
                                                await make_request<ChangeAccountInfoRequestBodyType>(`/accounts/${officerNif}`, "PATCH", {
                                                    body: {
                                                        intents: {
                                                            [intent.name]: event.target.checked
                                                        }
                                                    }
                                                });
                                                setNeedsRefresh(true);

                                                // ! Loading will be disabled by the refresh
                                            }}
                                        />
                                    }
                                    label={intent.description}
                                />
                            )
                        })}
                    </div>
                </ModalSection>

                <ModalSection title={"Ações"}>
                    <div className={modalsStyle.actionsInnerSectionDiv}>
                        <DefaultButton
                            style={{flex: 1}}
                            disabled={loading || accountInfo.defaultPassword}
                            onClick={() => setResetPasswordConfirmationOpen(true)}
                        >
                            Redefinir Palavra-Passe
                        </DefaultButton>

                        {/*If the account isn't suspended, show the button that suspends it*/}
                        <Gate show={!accountInfo.suspended}>
                            <DefaultButton
                                disabled={loading}
                                buttonColor={"orange"}
                                darkTextOnHover={false}
                                style={{flex: 1}}
                                onClick={() => changeSuspendedState(true)}
                            >
                                Suspender Conta
                            </DefaultButton>
                        </Gate>
                        {/*If the account is suspended, show the button that reactivates it*/}
                        <Gate show={accountInfo.suspended}>
                            <DefaultButton
                                disabled={loading}
                                buttonColor={"lightgreen"}
                                darkTextOnHover={true}
                                style={{flex: 1}}
                                onClick={() => changeSuspendedState(false)}
                            >
                                Reativar Conta
                            </DefaultButton>
                        </Gate>

                        <DefaultButton
                            disabled={loading}
                            buttonColor={"red"}
                            style={{flex: 1}}
                            onClick={() => setDeleteConfirmationOpen(true)}
                        >
                            Apagar Conta
                        </DefaultButton>
                    </div>
                </ModalSection>


                {/*Delete Account Confirmation*/}
                <ConfirmationDialog
                    open={deleteConfirmationOpen}
                    onDeny={() => setDeleteConfirmationOpen(false)}
                    title={"Apagar conta"} text={`Tens a certeza que desejas apagar a conta de ${officerFullName}?`}
                    onConfirm={async () => {
                        const response = await make_request(`/accounts/${officerNif}`, "DELETE");
                        if (!response.ok) {
                            return toast(`Erro ao apagar a conta:\n${((await response.json()) as RequestError).message}`, {type: "error"});
                        }

                        setDeleteConfirmationOpen(false);
                        toast("Conta apagada com sucesso", {type: "success"});

                        // Make the information refresh to reflect the changes and change the manage buttons
                        setNeedsRefresh(true);

                        // Close the account information modal
                        onClose();
                    }}
                />

                {/*Reset Password Confirmation*/}
                <ConfirmationDialog
                    open={resetPasswordConfirmationOpen}
                    onDeny={() => setResetPasswordConfirmationOpen(false)}
                    title={"Redefinir Palavra-Passe"} text={`Tens a certeza que desejas redefinir a palavra-passe de ${officerFullName} para a padrão?`}
                    onConfirm={async () => {
                        // Close the confirmation dialog
                        setResetPasswordConfirmationOpen(false);

                        // Set the loading state to true
                        setLoading(true);

                        // Make the request to reset the password
                        const response = await make_request(`/accounts/${officerNif}/resetpassword`, "POST");
                        if (!response.ok) {
                            return toast(`Erro ao redefinir a palavra-passe:\n${((await response.json()) as RequestError).message}`, {type: "error"});
                        }

                        toast("Palavra-passe redefinida com sucesso", {type: "success"});

                        // Make the information refresh to reflect the changes and change the manage buttons
                        setNeedsRefresh(true);
                    }}
                />
            </>
        )
    }

    return (
        <Modal open={open} onClose={onClose} title={`Conta de ${officerFullName}`}>
            {modalContent}
        </Modal>
    )
}

export default AccountInformationModal;