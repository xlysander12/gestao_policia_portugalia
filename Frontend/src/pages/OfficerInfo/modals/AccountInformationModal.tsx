import React, {ReactElement, useContext, useEffect, useState} from "react";
import {ForceDataContext, ForceDataContextType} from "../../../force-data-context.ts";
import {useImmer} from "use-immer";
import {make_request} from "../../../utils/requests.ts";
import Loader from "../../../components/Loader/loader.tsx";
import modalsStyle from "./officerinfomodals.module.css";
import {FormControlLabel, Stack, Switch, Typography} from "@mui/material";
import {DefaultButton} from "../../../components/DefaultComponents";
import {ConfirmationDialog, Modal, ModalSection} from "../../../components/Modal/modal.tsx";
import {CancelOutlined, CheckCircleOutlined} from "@mui/icons-material";
import {AccountInfoResponse} from "@portalseguranca/api-types/account/output";
import {LoggedUserContext, LoggedUserContextType} from "../../../components/PrivateRoute/logged-user-context.ts";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/index.ts";
import {toast} from "react-toastify";
import Gate from "../../../components/Gate/gate.tsx";
import {useLocation, useNavigate} from "react-router-dom";

type AccountInformationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: number,
    officerFullName: string
}

// TODO: Add a loader for when changing values or clicking buttons
function AccountInformationModal({open, onClose, officerNif, officerFullName}: AccountInformationModalProps) {
    // Getting the force's data from the context
    const forceData = useContext<ForceDataContextType>(ForceDataContext);

    // Getting the logged user data from the context
    const loggedUserData = useContext<LoggedUserContextType>(LoggedUserContext);

    // Initialize the useNavigate hook
    const navigate = useNavigate();

    const [accountExists, setAccountExists] = useState<boolean | null>(null);

    // Initialize the state that contains the officer's account information
    // // Create an object with all intents and set them to false
    let intentsObject: {[key: string]: boolean} = {};
    for (let intent of forceData.intents) {
        intentsObject[intent.name] = false;
    }

    const [accountInfo, setAccountInfo] = useImmer({
        defaultPassword: false,
        suspended: false,
        lastUsed: new Date(),
        intents: intentsObject
    });

    // State for managing the refresh of the account information
    const [needsRefresh, setNeedsRefresh] = useState(true);
    const [justRefreshed, setJustRefreshed] = useState(false);

    // State for the confirmation dialog for account deletion
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

    // Fetch the current information about the officer
    useEffect(() => {
        async function fetchAccountInfo() {
            const accountInfoResponse = await make_request(`/accounts/${officerNif}`, "GET");

            // Check if the response is ok
            if (accountInfoResponse.status === 404) {
                setAccountExists(false);
                return;
            }

            // Convert the response to JSON and set the account info state
            const accountInfoJson: AccountInfoResponse = await accountInfoResponse.json();
            setAccountInfo(draft => {
                draft.defaultPassword = accountInfoJson.data.passwordChanged;
                draft.suspended = accountInfoJson.data.suspended;
                draft.lastUsed = new Date(Date.parse(accountInfoJson.data.lastUsed));
                draft.intents = accountInfoJson.data.intents;
            });

            setAccountExists(true);
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
        let response = await make_request(`/accounts/${officerNif}`, "POST");
        if (!response.ok) {
            return toast(`Erro ao ativar a conta:\n${((await response.json()) as RequestSuccess).message}`, {type: "error"});
        }
        toast("Conta ativada com sucesso", {type: "success"});
        setNeedsRefresh(true);
    }

    // Function to change the suspended state of an account
    async function changeSuspendedState(suspend: boolean) {
        // Make the request to change the suspended state
        let response = await make_request(`/accounts/${officerNif}`, "PATCH", {
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
    }

    let lastUsedString;
    if (isNaN(accountInfo.lastUsed.getDate())) {
        lastUsedString = "Nunca utilizada";
    } else {
        lastUsedString = `${accountInfo.lastUsed.getDate().toString().padStart(2, "0")}/${(accountInfo.lastUsed.getMonth() + 1).toString().padStart(2, "0")}/${accountInfo.lastUsed.getFullYear()} @ ${accountInfo.lastUsed.getHours().toString().padStart(2, "0")}:${accountInfo.lastUsed.getMinutes().toString().padStart(2, "0")}`;
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
                            {accountInfo.defaultPassword ? <CheckCircleOutlined sx={{color: "green"}}/> : <CancelOutlined sx={{color: "red"}}/>}
                        </Stack>

                        <Stack alignItems={"center"} direction={"row"} gap={0.5}>
                            <Typography>Conta ativa:</Typography>
                            {!accountInfo.suspended ? <CheckCircleOutlined sx={{color: "green"}}/> : <CancelOutlined sx={{color: "red"}}/>}
                        </Stack>

                        <Typography>Última utilização: {lastUsedString}</Typography>
                    </div>
                </ModalSection>

                <ModalSection title={"Permissões"}>
                    <div className={modalsStyle.informationInnerSectionDiv}>
                        {forceData.intents.map((intent) => {
                            return (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={accountInfo.intents[intent.name]}
                                            disabled={!loggedUserData.intents[intent.name]}
                                            onChange={async (event) => {
                                                setAccountInfo(draft => {
                                                    draft.intents[intent.name] = event.target.checked;
                                                });
                                                await make_request(`/accounts/${officerNif}/intents`, "PATCH", {body: {[intent.name]: event.target.checked}});
                                                setNeedsRefresh(true);
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
                        <DefaultButton style={{flex: 1}}>Reset Palavra-Passe</DefaultButton>

                        {/*If the account isn't suspended, show the button that suspends it*/}
                        <Gate show={!accountInfo.suspended}>
                            <DefaultButton
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
                                buttonColor={"lightgreen"}
                                darkTextOnHover={true}
                                style={{flex: 1}}
                                onClick={() => changeSuspendedState(false)}
                            >
                                Reativar Conta
                            </DefaultButton>
                        </Gate>

                        <DefaultButton
                            buttonColor={"red"}
                            style={{flex: 1}}
                            onClick={() => setDeleteConfirmationOpen(true)}
                        >
                            Apagar Conta
                        </DefaultButton>
                    </div>
                </ModalSection>


                <ConfirmationDialog open={deleteConfirmationOpen} onDeny={() => setDeleteConfirmationOpen(false)} title={"Apagar conta"} text={`Tens a certeza que desejas apagar a conta de ${officerFullName}?`} onConfirm={async () => {
                    let response = await make_request(`/accounts/${officerNif}`, "DELETE");
                    if (!response.ok) {
                        return toast(`Erro ao apagar a conta:\n${((await response.json()) as RequestError).message}`, {type: "error"});
                    }

                    setDeleteConfirmationOpen(false);
                    toast("Conta apagada com sucesso", {type: "success"});

                    // Make the information refresh to reflext the changes and change the manage buttons
                    setNeedsRefresh(true);

                    // Close the account information modal
                    onClose();
                }} />
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