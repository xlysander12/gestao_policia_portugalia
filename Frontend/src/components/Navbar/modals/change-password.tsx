import {ConfirmationDialog, Modal, ModalSection} from "../../Modal/modal.tsx";
import {useState} from "react";

import style from "./change-password.module.css";
import {DefaultButton, DefaultOutlinedTextField, DefaultTypography} from "../../DefaultComponents";
import {Divider} from "@mui/material";
import { make_request } from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import { RequestSuccess } from "@portalseguranca/api-types/index.ts";
import { ChangePasswordRequestBodyType } from "@portalseguranca/api-types/account/input";

type ChangePasswordModalProps = {
    open: boolean,
    onClose: () => void
}
function ChangePasswordModal({open, onClose}: ChangePasswordModalProps) {
    // State of the Confirmation Modal
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

    // Loading state
    const [loading, setLoading] = useState<boolean>(false);

    // State to hold the passwords
    const [oldPassword, setOldPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [repeatPassword, setRepeatPassword] = useState<string>("");

    async function changePassword() {
        // Check if the new password is the same as the repeat password
        if (newPassword !== repeatPassword) {
            return;
        }

        // Set the loading to true
        setLoading(true);

        // Make the request to change the password
        const response = await make_request<ChangePasswordRequestBodyType>(`/accounts/change-password`, "POST", {
            body: {
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: repeatPassword
            }
        });
        const responseJson: RequestSuccess = await response.json();

        // Show toast with the response
        toast(responseJson.message, {type: response.ok ? "success" : "error"});

        // Set the loading to false
        setLoading(false);

        if (response.ok) {
            onClose();
        }
    }

    return (
        <>
            <Modal open={open} title={"Alterar Palavra-Passe"} onClose={onClose}>
                <ModalSection title={"Dados"}>
                    <div className={style.main}>
                        {/* Old Password */}
                        <DefaultTypography
                            color={"var(--portalseguranca-color-accent)"}
                            fontWeight={"bold"}
                        >
                            Palavra-Passe Antiga:
                        </DefaultTypography>

                        <DefaultOutlinedTextField
                            type={"password"}
                            size={"small"}
                            alternateColor
                            fullWidth
                            disabled={loading}
                            onChange={(event) => setOldPassword(event.target.value)}
                        />

                        <Divider flexItem sx={{margin: "10px 0"}}/>

                        {/* New Password */}
                        <DefaultTypography
                            color={"var(--portalseguranca-color-accent)"}
                            fontWeight={"bold"}
                        >
                            Nova Palavra-Passe:
                        </DefaultTypography>

                        <DefaultOutlinedTextField
                            type={"password"}
                            size={"small"}
                            alternateColor
                            sx={{marginBottom: "10px"}}
                            fullWidth
                            error={newPassword !== repeatPassword}
                            disabled={loading}
                            onChange={(event) => setNewPassword(event.target.value)}
                        />

                        {/* Repeat Password */}
                        <DefaultTypography
                            color={"var(--portalseguranca-color-accent)"}
                            fontWeight={"bold"}
                        >
                            Confirma Nova Palavra-Passe:
                        </DefaultTypography>

                        <DefaultOutlinedTextField
                            type={"password"}
                            size={"small"}
                            alternateColor
                            fullWidth
                            error={newPassword !== repeatPassword}
                            disabled={loading}
                            onChange={(event) => setRepeatPassword(event.target.value)}
                        />
                    </div>
                </ModalSection>
                <ModalSection title={"Ações"}>
                    <DefaultButton
                        buttonColor={"lightGreen"}
                        fullWidth
                        disabled={loading}
                        onClick={() => setConfirmModalOpen(true)}
                    >
                        Confirmar
                    </DefaultButton>
                </ModalSection>
            </Modal>

            <ConfirmationDialog
                open={confirmModalOpen}
                title={"Alterar Palavra-Passe"}
                text={"Tens a certeza que desejas trocar a palavra-passe?\n" +
                    "Todas as sessões da tua conta, exceto esta, irão ser terminadas"}
                onConfirm={changePassword}
                onDeny={() => setConfirmModalOpen(false)}
            />
        </>
    )
}

export default ChangePasswordModal;