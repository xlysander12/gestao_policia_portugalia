import {make_request} from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import {Modal, ModalSection} from "../../../components/Modal";
import modalsStyle from "./officerinfomodals.module.css";
import {DefaultButton, DefaultOutlinedTextField} from "../../../components/DefaultComponents";
import React, {FormEvent, useState} from "react";
import {FormControlLabel, Radio, RadioGroup} from "@mui/material";
import Gate from "../../../components/Gate/gate.tsx";
import {DeleteOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import { BaseResponse } from "@portalseguranca/api-types";

type FireModalProps = {
    open: boolean,
    onClose: () => void,
    onFired: () => void,
    officerFullName: string,
    officerNif: number,
}
function FireModal({open, onClose, onFired, officerFullName, officerNif}: FireModalProps) {
    //  State that holds the firing type
    const [firingType, setFiringType] = useState<"resigned" | "fired">("resigned");

    // Initialize the variable that contains the officer's fire reason
    let fireReason: string = "";

    const fireOfficer = async (event: FormEvent) => {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        const fireRequest = await make_request<DeleteOfficerRequestBody>(`/officers/${officerNif}`, "DELETE", {
                body: {
                    reason: fireReason
                }
            }
        );

        // Check if the response is ok
        if (!fireRequest.ok) {
            alert((await fireRequest.json() as BaseResponse).message);
            return;
        }

        // After firing the officer, we can show a notification and reload the page to the officer's list
        toast(`${officerFullName} despedido com sucesso!`, {type: "success"});
        onFired();

        // Close the modal
        onClose();
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Despedir ${officerFullName}`}
        >
            <form onSubmit={fireOfficer}>
                <div className={modalsStyle.formDiv}>
                    {/*Text area to input the firing reason*/}
                    <ModalSection title={"Dados do Despedimento"}>
                        <RadioGroup
                            name={"firingType"}
                            value={firingType}
                            onChange={(event) => setFiringType(event.target.value as "fired" | "resigned")}
                        >
                            <FormControlLabel value={"resigned"} control={<Radio />} label={"Demição"} />
                            <FormControlLabel value={"fired"} control={<Radio />} label={"Despedimento"} />
                        </RadioGroup>
                        <Gate show={firingType === "fired"}>
                            <DefaultOutlinedTextField
                                label={"Motivo"}
                                fullWidth
                                multiline
                                maxRows={5}
                                onChange={(event) => fireReason = event.target.value}
                                sx={{marginTop: "15px"}}
                            />
                        </Gate>
                    </ModalSection>

                    {/*Button to submit the form and, therefore, fire the officer*/}
                    <DefaultButton buttonColor={"red"} type={"submit"}>Despedir</DefaultButton>
                </div>
            </form>
        </Modal>
    );
}

export default FireModal;