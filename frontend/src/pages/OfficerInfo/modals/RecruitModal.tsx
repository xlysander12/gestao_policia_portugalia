import React, {ReactElement} from "react";
import {useImmer} from "use-immer";
import {useNavigate} from "react-router-dom";
import {make_request} from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import {Modal, ModalSection} from "../../../components/Modal/modal.tsx";
import modalsStyle from "./officerinfomodals.module.css";
import {DefaultButton, DefaultTextField} from "../../../components/DefaultComponents";
import {FormControlLabel, Switch} from "@mui/material";

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
        steam: "",
        recruit: false
    });

    // Navigate hook
    const navigate = useNavigate();

    const recruitMember = async (event: SubmitEvent) => {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await make_request(`/officers/${officerInfo.nif}${officerInfo.recruit ? "?recruit": ""}`, "PUT",
            {
                body: {
                    name: officerInfo.name,
                    nif: officerInfo.nif,
                    phone: officerInfo.phone,
                    iban: officerInfo.iban,
                    kms: officerInfo.kms,
                    discord: officerInfo.discord,
                    steam: officerInfo.steam
                }
            });

        // Check if the response is ok
        if (!recruitRequest.ok) {
            alert((await recruitRequest.json()).message);
            return;
        }

        // After recruiting the new member, we can reload the page using the officer's nif as a query param
        toast(`Agente ${officerInfo.name} contratado com sucesso!`, {type: "success"});
        navigate(`/efetivos/${officerInfo.nif}`);
    }

    return (
        <Modal width={"37%"} open={open} onClose={onClose} title={"Recrutar novo efetivo"}>
            {/*@ts-ignore*/}
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
                            error={officerInfo.nif !== "" && !(/^[0-9]{7,9}$/.test(officerInfo.nif))}
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
                            error={officerInfo.steam !== "" && !(/^steam:[0-9]{9}$/.test(officerInfo.steam)) && !(/^http(s)?:\/\/steamcommunity.com\/id\/.+/.test(officerInfo.steam))}
                            required
                            inputProps={{
                                name: "officerSteam",
                                pattern: "(^steam:([0-9]|[a-z])+$)|(^http(s)?:\/\/steamcommunity\.com\/id\/.+$)"
                            }}
                        />

                        <FormControlLabel
                            control={<Switch
                                onChange={(event) => setOfficerInfo(draft => {draft.recruit = event.target.checked})}
                            />}
                            label={"Recrutar como Cadete"}
                            sx={{
                                margin: "10px 0 0 0",

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
    );
}

export default RecruitModal;