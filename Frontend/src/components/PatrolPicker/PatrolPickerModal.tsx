import PatrolPicker, {PatrolPickerProps} from "./PatrolPicker.tsx";
import {Modal} from "../Modal";

type PatrolPickerModalProps = PatrolPickerProps & {
    open: boolean
    onClose: () => void
}
function PatrolPickerModal(props: PatrolPickerModalProps) {
    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={"Escolhe uma patrulha"}
            width={"90%"}
        >
            <div style={{
                boxSizing: "border-box",
                backgroundColor: "var(--portalseguranca-color-background-light)",
                padding: "10px",
                height: "100%"
            }}>
                <PatrolPicker
                    callback={(id) => {
                        props.onClose();
                        props.callback(id);
                    }}
                    filters={props.filters}
                />
            </div>
        </Modal>
    );
}

export default PatrolPickerModal;