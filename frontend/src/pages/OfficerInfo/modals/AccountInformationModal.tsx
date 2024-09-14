import React, {ReactElement, useContext, useEffect, useState} from "react";
import {ForceDataContext, ForceDataContextType} from "../../../force-data-context.ts";
import {useImmer} from "use-immer";
import {make_request} from "../../../utils/requests.ts";
import Loader from "../../../components/Loader/loader.tsx";
import modalsStyle from "./officerinfomodals.module.css";
import {FormControlLabel, Stack, Switch, Typography} from "@mui/material";
import {DefaultButton} from "../../../components/DefaultComponents";
import {Modal, ModalSection} from "../../../components/Modal/modal.tsx";
import {CancelOutlined, CheckCircleOutlined} from "@mui/icons-material";
import {AccountInfoResponse} from "@portalseguranca/api-types/api/account/schema";

type AccountInformationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: number,
    officerFullName: string
}
function AccountInformationModal({open, onClose, officerNif, officerFullName}: AccountInformationModalProps) {
    // Getting the force's data from the context
    const forceData = useContext<ForceDataContextType>(ForceDataContext);

    const [accountExists, setAccountExists] = useState<boolean | null>(null);

    // Initialize the state that contains the officer's account information
    // // Create an object with all intents and set them to false
    let intentsObject: {[key: string]: boolean} = {};
    for (let intent of forceData.intents) {
        intentsObject[intent.name] = false;
    }

    const [accountInfo, setAccountInfo] = useImmer({
        defaultPassword: false,
        lastUsed: new Date(),
        intents: intentsObject
    });

    // Fetch the current information about the officer
    useEffect(() => {
        async function fetchAccountInfo() {
            const accountInfoResponse = await make_request(`/accounts/${officerNif}/info`, "GET");

            // Check if the response is ok
            if (accountInfoResponse.status === 404) {
                setAccountExists(false);
                return;
            }

            // Convert the response to JSON and set the account info state
            const accountInfoJson: AccountInfoResponse = await accountInfoResponse.json();
            setAccountInfo(draft => {
                draft.defaultPassword = accountInfoJson.data.passwordChanged;
                draft.lastUsed = new Date(Date.parse(accountInfoJson.data.lastUsed));
                draft.intents = accountInfoJson.data.intents;
            });

            setAccountExists(true);
        }

        fetchAccountInfo();
    }, [officerNif]);

    let modalContent: ReactElement;

    if (accountExists === null) {
        modalContent = (
            <Loader size={"100px"}/>
        );
    } else if (!accountExists) {
        modalContent = (
            <div className={modalsStyle.noAccountDiv}>
                <Typography color={"var(--portalseguranca-color-text-light)"}>Este efetivo não tem a conta ativada.<br/>Ativar a conta vai permitir o login com este nif e a palavra-passe padrão</Typography>
                {/*TODO: Change onClick behaviour*/}
                <DefaultButton
                    buttonColor={"var(--portalseguranca-color-accent)"}
                    darkTextOnHover
                    onClick={async () => {console.log("Activate account")}}
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
                         <Typography>Última utilização: {`${accountInfo.lastUsed.getDate().toString().padStart(2, "0")}/${(accountInfo.lastUsed.getMonth() + 1).toString().padStart(2, "0")}/${accountInfo.lastUsed.getFullYear()} @ ${accountInfo.lastUsed.getHours().toString().padStart(2, "0")}:${accountInfo.lastUsed.getMinutes().toString().padStart(2, "0")}`}</Typography>
                    </div>
                </ModalSection>

                <ModalSection title={"Permissões"}>
                    <div className={modalsStyle.informationInnerSectionDiv}>
                        {forceData.intents.map((intent) => {
                            return (
                                <FormControlLabel
                                    control={<Switch
                                        checked={accountInfo.intents[intent.name]}
                                        onChange={(event) => setAccountInfo(draft => {draft.intents[intent.name] = event.target.checked})}
                                    />}
                                    label={intent.description}
                                />
                            )
                        })}
                    </div>
                </ModalSection>
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