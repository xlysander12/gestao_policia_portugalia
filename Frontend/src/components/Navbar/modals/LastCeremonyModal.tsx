import {Modal, ModalSection} from "../../Modal";
import {DefaultButton, DefaultDatePicker, DefaultTypography} from "../../DefaultComponents";
import {Divider} from "@mui/material";
import moment, {Moment} from "moment";
import { useState } from "react";
import {useForceData} from "../../../hooks";
import {make_request} from "../../../utils/requests.ts";
import {ChangeLastCeremonyRequestBodyType} from "@portalseguranca/api-types/util/input";
import { BaseResponse } from "@portalseguranca/api-types";
import {toast} from "react-toastify";

type LastCeremonyModalProps = {
    open: boolean;
    onClose: () => void;
}
function LastCeremonyModal(props: LastCeremonyModalProps) {
    // Get force data
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(false);

    const [date, setDate] = useState<Moment>(forceData.last_ceremony);

    async function updateLastCeremony() {
        // Set the loading flag to true
        setLoading(true);

        // Make the request to the API
        const response = await make_request<ChangeLastCeremonyRequestBodyType>("/util/last-ceremony", "PUT", {
            body: {
                timestamp: date.unix()
            }
        });
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            // Show error message
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        toast.success("Data da última cerimónia atualizada com sucesso!\nRecarregue a página para ver as alterações.");
        setLoading(false);
        props.onClose();
    }

    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={"Última Cerimónia"}
        >
            <ModalSection title={"Detalhes"}>
                <DefaultTypography>Atualizar a data da última cerimónia fará com que, na aba das Avaliações, o filtro automático será definido para depois desta data.</DefaultTypography>
                <DefaultTypography>Estas alterações só serão visiveis após recarregar a página!</DefaultTypography>

                <Divider />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Ultima Cermónia:</DefaultTypography>
                <DefaultDatePicker
                    disabled={loading}
                    value={date}
                    onChange={(date) => {
                        setDate(moment(date));
                    }}
                />
            </ModalSection>

            <ModalSection title={"Ações"}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                    }}
                >
                    <DefaultButton
                        disabled={loading || !date.isValid()}
                        buttonColor={"lightgreen"}
                        darkTextOnHover
                        onClick={updateLastCeremony}
                        sx={{flex: 1}}
                    >
                        Aplicar
                    </DefaultButton>
                </div>
            </ModalSection>
        </Modal>
    );
}

export default LastCeremonyModal;