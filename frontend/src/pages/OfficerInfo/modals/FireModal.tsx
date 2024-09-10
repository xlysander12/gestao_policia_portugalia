import {useNavigate} from "react-router-dom";
import {make_request} from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import {Modal, ModalSection} from "../../../components/Modal/modal.tsx";
import modalsStyle from "./officerinfomodals.module.css";
import {DefaultButton, DefaultOutlinedTextField} from "../../../components/DefaultComponents";
import React from "react";

type FireModalProps = {
    open: boolean,
    onClose: () => void,
    officerFullName: string,
    officerNif: string,
}
function FireModal({open, onClose, officerFullName, officerNif}: FireModalProps) {
    // Initialize useNavigate hook
    const navigate = useNavigate();

    // Initialize the variable that contains the officer's fire reason
    let fireReason: string = "";

    const fireOfficer = async (event: SubmitEvent) => {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        const fireRequest = await make_request(
            `/officers/${officerNif}`,
            "DELETE", {body: {reason: fireReason}}
        );

        // Check if the response is ok
        if (!fireRequest.ok) {
            alert((await fireRequest.json()).message);
            return;
        }

        // After firing the officer, we can show a notification and reload the page to the officer's list
        toast(`${officerFullName} despedido com sucesso!`, {type: "success"});
        navigate({
            pathname: "/efetivos"
        });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Despedir ${officerFullName}`}
        >
            {/*@ts-ignore*/}
            <form onSubmit={fireOfficer}>
                <div className={modalsStyle.formDiv}>
                    {/*Text area to input the firing reason*/}
                    <ModalSection title={"Dados do Despedimento"}>
                        <DefaultOutlinedTextField
                            label={"Motivo"}
                            fullWidth
                            multiline
                            maxRows={5}
                            onChange={(event) => fireReason = event.target.value}
                        />
                    </ModalSection>

                    {/*Button to submit the form and, therefore, fire the officer*/}
                    <DefaultButton buttonColor={"red"} type={"submit"}>Despedir</DefaultButton>
                </div>
            </form>
        </Modal>
    );
}

export default FireModal;