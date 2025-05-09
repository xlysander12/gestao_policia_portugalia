import React, {FormEvent, ReactElement} from "react";
import {useImmer} from "use-immer";
import {useNavigate} from "react-router-dom";
import {make_request} from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import {ConfirmationDialog, Modal, ModalSection} from "../../../components/Modal";
import modalsStyle from "./officerinfomodals.module.css";
import {DefaultButton, DefaultTextField} from "../../../components/DefaultComponents";
import {Checkbox, FormControlLabel} from "@mui/material";
import {OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import { CreateOfficerRequestBody } from "@portalseguranca/api-types/officers/input.ts";
import { BaseResponse } from "@portalseguranca/api-types";

type RecruitModalProps = {
    open: boolean
    onClose?: () => void
}
function RecruitModal({open, onClose}: RecruitModalProps): ReactElement {
    // Initialize the state that contain the new officer's info
    const [officerInfo, setOfficerInfo] = useImmer({
        name: "",
        nif: "",
        phone: "",
        iban: "",
        kms: 0,
        discord: "",
        steam: ""
    });

    // State that hold the confirmation dialog
    const [restoreDialog, setRestoreDialog] = useImmer({
        open: false,
        last_asked_nif: 0,
        last_asked_name: "",
        is_error: false
    });

    // Navigate hook
    const navigate = useNavigate();

    const recruitMember = async (event: FormEvent) => {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await make_request<CreateOfficerRequestBody>(`/officers/${officerInfo.nif}`, "PUT",
            {
                body: {
                    name: officerInfo.name,
                    phone: Number(officerInfo.phone),
                    iban: officerInfo.iban,
                    kms: officerInfo.kms,
                    discord: Number(officerInfo.discord),
                    steam: officerInfo.steam
                }
            });
        const recruit_json = await recruitRequest.json() as BaseResponse;

        // Check if the response is ok
        if (!recruitRequest.ok) {
            toast.error(recruit_json.message);
            return;
        }

        // After recruiting the new member, we can reload the page using the officer's nif as a query param
        toast(`Agente ${officerInfo.name} contratado com sucesso!`, {type: "success"});
        navigate(`/efetivos/${officerInfo.nif}`);
    }

    const checkOfficer = async (nif: number) => {
        // Set the restore dialog error flag to false
        setRestoreDialog((draft) => {
            draft.is_error = false
        });

        // Make sure the NIF is valid
        if (isNaN(nif)) return;

        // Compare the NIF with the last asked one
        if (restoreDialog.last_asked_nif === nif) return;

        // Make the request to check if there is a former officer with the same NIF
        const officerCheckRequest = await make_request(`/officers/${nif}`, "GET");

        // * Check if the response is 404
        // If it is, the officer is not a former officer
        if (officerCheckRequest.status === 404) {
            return;
        }

        // Get the former officer's data
        const officerCheckResponse: OfficerInfoGetResponse = await officerCheckRequest.json();

        // Check if the entered officer isn't already an active one
        if (!officerCheckResponse.meta.former) {
            setRestoreDialog((draft) => {
                draft.is_error = true
            });
            toast.error("Esse efetivo já é ativo na força!");
            return;
        }

        // * If it's not an active one, then we can open the restore dialog since it's a former one
        // Set the restore dialog state with the former officer's data
        setRestoreDialog((draft) => {
            draft.open = true;
            draft.last_asked_nif = officerCheckResponse.data.nif;
            draft.last_asked_name = officerCheckResponse.data.name;
        });
    }

    const restoreOfficer = async (nif: number) => {
        // Make the request to restore the officer
        const restoreRequest = await make_request(`/officers/${nif}/restore`, "POST");
        const restoreJson = await restoreRequest.json() as BaseResponse;

        // Output the response to a toast
        toast(restoreJson.message, {type: restoreRequest.ok ? "success" : "error"});

        // If the request was successful, navigate to the page of the restored officer
        if (restoreRequest.ok) {
            navigate(`/efetivos/${nif}`);
        }
    }

    return (
        <>
            <Modal width={"37%"} open={open} onClose={onClose} title={"Contratar novo efetivo"}>
                <form onSubmit={recruitMember}>
                    <ModalSection title={"Informações Pessoais"}>
                        <div className={modalsStyle.formDiv}>
                            {/* TODO: add proper titles to explain the custom patterns */}
                            <DefaultTextField
                                fullWidth
                                label={"Nome"}
                                type={"text"}
                                onChange={(event) => setOfficerInfo(draft => {draft.name = event.target.value})}
                                error={officerInfo.name !== "" && !(/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/.test(officerInfo.name))}
                                sx={{margin: "10px 0 0 0"}}
                                required
                                inputProps={{
                                    name: "officerName",
                                    pattern: "^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$"
                                }}
                            />

                            <DefaultTextField
                                fullWidth
                                label={"NIF"}
                                type={"text"}
                                onChange={(event) => setOfficerInfo(draft => {draft.nif = event.target.value})}
                                onBlur={() => {void checkOfficer(parseInt(officerInfo.nif))}}
                                error={officerInfo.nif !== "" && (!(/^[0-9]{7,9}$/.test(officerInfo.nif)) || restoreDialog.is_error)}
                                sx={{margin: "10px 0 0 0"}}
                                required
                                inputProps={{
                                    name: "officerNIF",
                                    pattern: "^[0-9]{7,9}$"
                                }}
                            />

                            <DefaultTextField
                                fullWidth
                                label={"Telemóvel"}
                                type={"text"}
                                onChange={(event) => setOfficerInfo(draft => {draft.phone = event.target.value})}
                                error={officerInfo.phone !== "" && !(/^[0-9]{9}$/.test(officerInfo.phone))}
                                sx={{margin: "10px 0 0 0"}}
                                required
                                inputProps={{
                                    name: "officerPhone",
                                    pattern: "^[0-9]{9}$"
                                }}
                            />

                            <DefaultTextField
                                fullWidth
                                label={"IBAN"}
                                type={"text"}
                                onChange={(event) => setOfficerInfo(draft => {draft.iban = event.target.value})}
                                error={officerInfo.iban !== "" && !(/^PT[0-9]{5,8}$/.test(officerInfo.iban))}
                                sx={{margin: "10px 0 0 0"}}
                                required
                                inputProps={{
                                    name: "officerIBAN",
                                    pattern: "^PT[0-9]{5,8}$"
                                }}
                            />

                            <DefaultTextField
                                fullWidth
                                label={"KMs"}
                                defaultValue={0}
                                type={"number"}
                                inputProps={{step: 100, name: "officerKMs"}}
                                onChange={(event) => setOfficerInfo(draft => {draft.kms = Number(event.target.value)})}
                                sx={{margin: "10px 0 0 0"}}
                                required
                            />

                            <DefaultTextField
                                fullWidth
                                label={"Discord ID"}
                                type={"text"}
                                onChange={(event) => setOfficerInfo(draft => {draft.discord = event.target.value})}
                                sx={{margin: "10px 0 0 0"}}
                                required
                                inputProps={{
                                    name: "officerDiscord"
                                }}
                            />

                            <DefaultTextField
                                fullWidth
                                label={"Steam ID / URL"}
                                type={"text"}
                                onChange={(event) => setOfficerInfo(draft => {draft.steam = event.target.value})}
                                sx={{margin: "10px 0 0 0"}}
                                error={officerInfo.steam !== "" && !(/^steam:([0-9]|[a-z])+$/.test(officerInfo.steam)) && !(/^http(s)?:\/\/steamcommunity.com\/id\/.+/.test(officerInfo.steam))}
                                inputProps={{
                                    name: "officerSteam",
                                    pattern: "(^steam:([0-9]|[a-z])+$)|(^http(s)?://steamcommunity.com/id/.+$)"
                                }}
                            />
                        </div>
                    </ModalSection>

                    <DefaultButton
                        type={"submit"}
                        buttonColor={"green"}
                        fullWidth
                    >
                        Contratar
                    </DefaultButton>
                </form>
            </Modal>

            <ConfirmationDialog
                open={restoreDialog.open}
                title={`Restaurar ${restoreDialog.last_asked_name}`}
                text={
                    `Existe um antigo efetivo com o mesmo NIF inserido (#${restoreDialog.last_asked_nif}):\n
                    - ${restoreDialog.last_asked_name}\n
                    Deseja restaurar este efetivo?`
                }
                onConfirm={() => restoreOfficer(restoreDialog.last_asked_nif)}
                onDeny={() => setRestoreDialog((draft) => {
                    draft.open = false
            })} />
        </>
    );
}

export default RecruitModal;