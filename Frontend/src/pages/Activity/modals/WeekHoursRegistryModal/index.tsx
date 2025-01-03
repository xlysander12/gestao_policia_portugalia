import {useContext, useEffect, useState} from "react";
import {
    OfficerSpecificHoursResponse,
    OfficerSpecificHoursType
} from "@portalseguranca/api-types/officers/activity/output";
import {make_request} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import { RequestError } from "@portalseguranca/api-types/index.ts";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal/modal.tsx";
import Gate from "../../../../components/Gate/gate.tsx";
import Loader from "../../../../components/Loader/loader.tsx";
import {OfficerData, OfficerDataRaw, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {ForceDataContext, getObjectFromId} from "../../../../force-data-context.ts";
import style from "./index.module.css";
import {Divider, Typography} from "@mui/material";
import {DefaultButton, DefaultTextField} from "../../../../components/DefaultComponents";

function toHoursAndMinutes(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;  return `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}`;
}

function padToTwoDigits(num: number) {
    return num.toString().padStart(2, '0');
}


type WeekHoursRegistryModalProps = {
    open: boolean,
    onClose: () => void,
    officer: number,
    entryId: number
}
function WeekHoursRegistryModal({open, onClose, officer, entryId}: WeekHoursRegistryModalProps) {
    // Get the force data from context
    const forceData = useContext(ForceDataContext);

    // Get the logged user info from context
    const loggedUser = useContext(LoggedUserContext);

    // Set the loading state
    const [loading, setLoading] = useState<boolean>(true);

    // Set the state that holds the registry data
    const [entryData, setEntryData] = useState<OfficerSpecificHoursType>();

    // Set the state that holds the patent and name of the officer that submitted the registry
    const [submittedBy, setSubmittedBy] = useState<string>();

    // Set the state of the delete confirmation dialog
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);

    // Function to handle the deletion of an entry
    function handleDelete() {

    }

    // Fetch the registry data when the modal is opened
    useEffect(() => {
        async function execute() {
            // Make sure the loading state is true
            setLoading(true);

            // Fetch the registry data
            const response = await make_request(`/officers/${officer}/activity/hours/${entryId}`, "GET");
            const data: RequestError | OfficerSpecificHoursResponse = await response.json();

            // If the request wasn't successful, show an error message
            if (!response.ok) {
                toast(data.message, {type: "error"});
                return;
            }

            // Set the registry data
            setEntryData((data as OfficerSpecificHoursResponse).data);

            // Get the name and patent of the officer that submitted the registry
            const submittedByResponse = await make_request(`/officers/${(data as OfficerSpecificHoursResponse).data.submitted_by}`, "GET");
            const submittedByData: RequestError | OfficerInfoGetResponse = await submittedByResponse.json();

            // If the request wasn't successful, show an error message
            if (!submittedByResponse.ok) {
                toast(submittedByData.message, {type: "error"});
                return;
            }

            // Set the state that holds the patent and name of the officer that submitted the registry
            const officerData = (submittedByData as OfficerInfoGetResponse).data as OfficerDataRaw;
            setSubmittedBy(`${getObjectFromId((officerData).patent, forceData.patents).name} ${officerData.name}`);

            // Set the loading state to false
            setLoading(false);
        }

        if (open) {
            execute();
        }
    }, [entryId, open]);

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={`Horas semanais #${entryId}`}
            >
                {/* Show Loader */}
                <Gate show={loading}>
                    <Loader size={"100px"}/>
                </Gate>

                <Gate show={!loading}>
                    <ModalSection title={"Detalhes"}>
                        <div className={style.hoursDetailsMainDiv}>
                            <div className={style.hoursDetailsWeekRangeDiv}>
                                <div>
                                    <Typography
                                        color={"var(--portalseguranca-color-accent)"}
                                        fontSize={"medium"}
                                        fontWeight={"bold"}
                                    >
                                        Início da semana:
                                    </Typography>
                                    <DefaultTextField
                                        disabled={true}
                                        sameTextColorWhenDisabled
                                        type={"date"}
                                        value={entryData?.week_start}
                                    />
                                </div>

                                <div>
                                    <Typography
                                        color={"var(--portalseguranca-color-accent)"}
                                        fontSize={"medium"}
                                        fontWeight={"bold"}
                                    >
                                        Fim da semana:
                                    </Typography>
                                    <DefaultTextField
                                        disabled={true}
                                        sameTextColorWhenDisabled
                                        type={"date"}
                                        value={entryData?.week_end}
                                    />
                                </div>
                            </div>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <Typography
                                color={"var(--portalseguranca-color-accent)"}
                                fontSize={"medium"}
                                fontWeight={"bold"}
                            >
                                Minutos (Horas):
                            </Typography>
                            <div className={style.hoursDetailsMinutesDiv}>
                                <DefaultTextField
                                    disabled={true}
                                    sameTextColorWhenDisabled
                                    type={"number"}
                                    value={entryData?.minutes}
                                    sx={{width: "55px"}}
                                />
                                <Typography
                                    color={"var(--portalseguranca-color-text-light)"}
                                >
                                    ({toHoursAndMinutes(entryData?.minutes!)})
                                </Typography>
                            </div>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <Typography
                                color={"var(--portalseguranca-color-accent)"}
                                fontSize={"medium"}
                                fontWeight={"bold"}
                            >
                                Submetido por:
                            </Typography>
                            <Typography
                                color={"var(--portalseguranca-color-text-light)"}
                            >
                                {submittedBy}
                            </Typography>
                        </div>
                    </ModalSection>

                    <Gate show={loggedUser.intents["activity"]}>
                        <ModalSection title={"Ações"}>
                            <div className={style.hoursActionsMainDiv}>
                                <DefaultButton
                                    buttonColor={"red"}
                                    sx={{flex: 1}}
                                    onClick={() => setDeleteConfirmationOpen(true)}
                                >
                                    Apagar Registo
                                </DefaultButton>

                            </div>
                        </ModalSection>
                    </Gate>
                </Gate>
            </Modal>

            <ConfirmationDialog open={deleteConfirmationOpen} title={"Apagar registo de Horas Semanais"} text={"Tens a certeza que desejas apagar este registo?\n" +
                "Esta ação não pode ser revertida"} onConfirm={handleDelete} onDeny={() => setDeleteConfirmationOpen(false)} />
        </>
    )
}

export default WeekHoursRegistryModal;