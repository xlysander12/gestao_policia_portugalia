import {useContext, useEffect, useState} from "react";
import {
    OfficerHoursResponse,
    OfficerSpecificHoursResponse,
    OfficerSpecificHoursType
} from "@portalseguranca/api-types/officers/activity/output";
import {make_request} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/index.ts";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal/modal.tsx";
import Gate from "../../../../components/Gate/gate.tsx";
import Loader from "../../../../components/Loader/loader.tsx";
import {OfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import style from "./index.module.css";
import {Divider, Typography} from "@mui/material";
import {DefaultButton, DefaultTextField, DefaultTypography} from "../../../../components/DefaultComponents";
import {useImmer} from "use-immer";
import { AddOfficerHoursBodyType } from "@portalseguranca/api-types/officers/activity/input.ts";
import {useForceData} from "../../../../hooks";

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
    entryId?: number,
    newEntry?: boolean,
}
function WeekHoursRegistryModal({open, onClose, officer, entryId, newEntry = false}: WeekHoursRegistryModalProps) {
    // Get the force data from context
    const [forceData] = useForceData();

    // Get the logged user info from context
    const loggedUser = useContext(LoggedUserContext);

    // Set the loading state
    const [loading, setLoading] = useState<boolean>(true);

    // Set the state that holds the registry data
    const [entryData, setEntryData] = useImmer<OfficerSpecificHoursType>({
        id: 0,
        week_start: "",
        week_end: "",
        minutes: 0,
        submitted_by: 0
    });

    // Set the state that holds if the officer did the minimum hours
    const [didMinimumHours, setDidMinimumHours] = useState<boolean>(false);

    // Set the state that holds the patent and name of the officer that submitted the registry
    const [submittedBy, setSubmittedBy] = useState<string>();

    // Set the state of the delete confirmation dialog
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);

    // Function to handle the creation of an entry
    async function handleCreate() {
        // Set the loading to true
        setLoading(true);

        // Make the request to create the entry
        const response = await make_request(`/officers/${officer}/activity/hours`, "POST", {
            body: {
                week_start: entryData.week_start,
                week_end: entryData.week_end,
                minutes: entryData.minutes
            } as AddOfficerHoursBodyType
        });
        const data: RequestSuccess = await response.json();

        // If the request wasn't successful, show an error message
        if (!response.ok) {
            toast(data.message, {type: "error"});
            return;
        }

        // Show a success message
        toast("Registo criado com sucesso", {type: "success"});

        // Close the modal
        onClose();
    }

    // Function to handle the deletion of an entry
    async function handleDelete() {
        // Make the request to delete the entry
        const response = await make_request(`/officers/${officer}/activity/hours/${entryId}`, "DELETE")
        const data: RequestError = await response.json();

        // If the request wasn't successful, show an error message
        if (!response.ok) {
            toast(data.message, {type: "error"});
            return;
        }

        // Show a success message
        toast("Registo apagado com sucesso", {type: "success"});

        // Close the modal
        onClose();
    }

    // * Fetch the registry data when the modal is opened - Existing entry only
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
            setDidMinimumHours((data as OfficerSpecificHoursResponse).meta.min_hours);

            // Get the name and patent of the officer that submitted the registry
            const submittedByResponse = await make_request(`/officers/${(data as OfficerSpecificHoursResponse).data.submitted_by}`, "GET");
            const submittedByData: RequestError | OfficerInfoGetResponse = await submittedByResponse.json();

            // If the request wasn't successful, show an error message
            if (!submittedByResponse.ok) {
                toast(submittedByData.message, {type: "error"});
                return;
            }

            // Set the state that holds the patent and name of the officer that submitted the registry
            const officerData = (submittedByData as OfficerInfoGetResponse).data as OfficerData;
            setSubmittedBy(`${getObjectFromId((officerData).patent, forceData.patents)!.name} ${officerData.name}`);

            // Set the loading state to false
            setLoading(false);
        }

        if (open && !newEntry) {
            execute();
        }

        return () => {
            if (!newEntry) {
                setEntryData({
                    id:  0,
                    week_start: "",
                    week_end: "",
                    minutes: 0,
                    submitted_by: 0
                });
            }
        }
    }, [entryId, open]);

    // * Fetch the last entry of the officer when the modal is opened - New entry only
    useEffect(() => {
        async function execute() {
            // Make sure the loading state is true
            setLoading(true);

            // Fetch all entries of the officer
            const response = await make_request(`/officers/${officer}/activity/hours`, "GET");
            const data: RequestError | OfficerHoursResponse = await response.json();

            // If the request wasn't successful, show an error message
            if (!response.ok) {
                toast((data as RequestError).message, {type: "error"});
                return;
            }

            // Get the most recent entry - The one with biggest week_end
            const mostRecentEntry = (data as OfficerHoursResponse).data.sort((a: OfficerSpecificHoursType, b: OfficerSpecificHoursType) => new Date(b.week_end).getTime() - new Date(a.week_end).getTime())[0];

            // Get the date 7 days after the week_end of the most recent entry
            const weekEnd = new Date(Date.parse(mostRecentEntry.week_end) + 7 * 24 * 60 * 60 * 1000);

            // Set the registry data with default values
            setEntryData((draft) => {
                draft.week_start = mostRecentEntry.week_end;
                draft.week_end = weekEnd.toISOString().split("T")[0];
            });

            // Set the loading state to false
            setLoading(false);
        }

        if (open && newEntry) {
            execute();
        }
    }, [open]);

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={newEntry ? "Novo Registo - Horas Semanais": `Horas semanais #${entryId}`}
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
                                        disabled={!newEntry}
                                        textWhenDisabled
                                        type={"date"}
                                        value={entryData?.week_start}
                                        onChange={(e) => setEntryData((draft) => {
                                            draft.week_start = e.target.value;
                                        })}
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
                                        disabled={!newEntry}
                                        textWhenDisabled
                                        type={"date"}
                                        value={entryData?.week_end}
                                        onChange={(e) => setEntryData((draft) => {
                                            draft.week_end = e.target.value;
                                        })}
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
                                    disabled={!newEntry}
                                    textWhenDisabled
                                    type={"number"}
                                    value={entryData?.minutes}
                                    onChange={(e) => setEntryData((draft) => {
                                        draft.minutes = parseInt(e.target.value);
                                    })}
                                    sx={{width: "55px"}}
                                    inputProps={{
                                        min: 0
                                    }}
                                />
                                <DefaultTypography
                                    color={didMinimumHours ? "var(--portalseguranca-color-text-light)": "red"}
                                >
                                    ({toHoursAndMinutes(entryData?.minutes!)})
                                </DefaultTypography>
                            </div>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <Gate show={!newEntry}>
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
                            </Gate>
                        </div>
                    </ModalSection>

                    <Gate show={loggedUser.intents["activity"]}>
                        <ModalSection title={"Ações"}>
                            <Gate show={!newEntry}>
                                <div className={style.hoursActionsMainDiv}>
                                    <DefaultButton
                                        buttonColor={"red"}
                                        sx={{flex: 1}}
                                        onClick={() => setDeleteConfirmationOpen(true)}
                                    >
                                        Apagar Registo
                                    </DefaultButton>
                                </div>
                            </Gate>

                            <Gate show={newEntry}>
                                <div className={style.hoursActionsMainDiv}>
                                    <DefaultButton
                                        buttonColor={"lightgreen"}
                                        sx={{flex: 1}}
                                        onClick={() => {
                                            if (!newEntry) {
                                                setDeleteConfirmationOpen(true)
                                            } else {
                                                handleCreate();
                                            }
                                        }}
                                    >
                                        {newEntry ? "Adicionar": "Apagar"} Registo
                                    </DefaultButton>
                                </div>
                            </Gate>
                        </ModalSection>
                    </Gate>
                </Gate>
            </Modal>

            <ConfirmationDialog open={deleteConfirmationOpen} title={"Apagar registo de Horas Semanais"}
                                text={"Tens a certeza que desejas apagar este registo?\n" +
                                    "Esta ação não pode ser revertida"} onConfirm={handleDelete}
                                onDeny={() => setDeleteConfirmationOpen(false)}/>
        </>
    )
}

export default WeekHoursRegistryModal;