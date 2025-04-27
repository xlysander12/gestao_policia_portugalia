import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {Modal} from "../Modal";
import {OfficerPicker} from "./index";

type OfficerListModalProps = {
    open: boolean
    onClose: () => void
    callback: (officer: MinifiedOfficerData) => void
    filter?: (officer: MinifiedOfficerData) => boolean
    patrol?: boolean
}
function OfficerPickerModal({open, onClose, callback, filter, patrol}: OfficerListModalProps) {

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
                <OfficerPicker patrol={patrol} filter={filter} callback={callback} />
            </div>
        </Modal>
    );
}

export default OfficerPickerModal;