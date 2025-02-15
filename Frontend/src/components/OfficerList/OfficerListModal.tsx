import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {Modal} from "../Modal";
import {OfficerList} from "./index";

type OfficerListModalProps = {
    open: boolean
    onClose: () => void
    callback: (officer: MinifiedOfficerData) => void
    patrol?: boolean
}
function OfficerListModal({open, onClose, callback, patrol}: OfficerListModalProps) {

    return (
        <Modal
            title={"Escolhe um Efetivo"}
            open={open}
            onClose={onClose}
            width={"75%"}
            height={"80vh"}
            disableScroll
        >
            <div style={{
                boxSizing: "border-box",
                backgroundColor: "var(--portalseguranca-color-background-light)",
                padding: "10px",
                height: "100%"
            }}>
                <OfficerList patrol={patrol} callbackFunction={callback} />
            </div>
        </Modal>
    );
}

export default OfficerListModal;