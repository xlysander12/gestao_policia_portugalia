import {Modal, ModalSection} from "../../../../components/Modal";
import {DefaultButton, DefaultOutlinedTextField, DefaultTypography} from "../../../../components/DefaultComponents";
import style from "./index.module.css";
import {useState} from "react";

type JustificationManagementModalProps = {
    open: boolean
    onClose: () => void
    approve: boolean
    callback: (comment?: string) => void
}

function JustificationManagementModal({open, onClose, approve, callback}: JustificationManagementModalProps) {

    const [comment, setComment] = useState<string>("");

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`${approve ? "Aprovar" : "Rejeitar"} Justificação`}
        >
            <ModalSection title={"Decisão"}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start"
                    }}
                >
                    <DefaultTypography
                        color={"var(--portalseguranca-color-accent)"}
                        fontSize={"medium"}
                        fontWeight={"bold"}
                    >
                        Comentário a anexar (opcional):
                    </DefaultTypography>
                    <DefaultOutlinedTextField
                        multiline
                        sx={{width: "100%", marginBottom: "10px"}}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
            </ModalSection>

            <ModalSection title={"Ações"}>
                <div className={style.justificationActionsDiv}>
                    <DefaultButton
                        buttonColor={approve ? "lightgreen" : "red"}
                        darkTextOnHover={approve}
                        sx={{flex: 1}}
                        onClick={() => {
                            const toSendComment = comment.trim() === "" ? undefined : comment.trim();
                            callback(toSendComment);
                            onClose();
                        }}
                    >
                        {approve ? "Aprovar" : "Rejeitar"}
                    </DefaultButton>
                </div>
            </ModalSection>
        </Modal>
    );
}

export default JustificationManagementModal;