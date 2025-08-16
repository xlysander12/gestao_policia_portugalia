import {FormEvent, useContext, useEffect, useState} from "react";
import {
    OfficerSpecificHoursResponse,
    OfficerSpecificHoursType
} from "@portalseguranca/api-types/officers/activity/output";
import {make_request} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import {RequestError, BaseResponse} from "@portalseguranca/api-types/index.ts";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import {OfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import style from "./index.module.css";
import {Divider, Typography} from "@mui/material";
import {
    DefaultButton,
    DefaultDatePicker,
    DefaultTextField,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {useImmer} from "use-immer";
import { AddOfficerHoursBodyType } from "@portalseguranca/api-types/officers/activity/input.ts";
import {useForceData} from "../../../../hooks";
import moment, {Moment} from "moment";
import {toHoursAndMinutes} from "../../../../utils/misc.ts";

type InnerOfficerHoursType = Omit<OfficerSpecificHoursType, "week_start" | "week_end"> & {
    week_start: Moment | null,
    week_end: Moment | null
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
    const [loading, setLoading] = useState<boolean>(false);

    // Set the state that holds the registry data
    const [entryData, setEntryData] = useImmer<InnerOfficerHoursType>({
        id: 0,
        week_start: moment().day(moment().day() >= 5 ? 5 : -2).subtract(7, "days"),
        week_end: moment().day(moment().day() >= 5 ? 5 : -2),
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
    async function handleCreate(event: FormEvent) {
        // Prevent page from reloading
        event.preventDefault();

        // Set the loading to true
        setLoading(true);

        // Make the request to create the entry
        const response = await make_request<AddOfficerHoursBodyType>(`/officers/${officer}/activity/hours`, "POST", {
            body: {
                week_start: entryData.week_start!.unix(),
                week_end: entryData.week_end!.unix(),
                minutes: entryData.minutes
            }
        });
        const data: BaseResponse = await response.json();

        // If the request wasn't successful, show an error message
        if (!response.ok) {
            toast(data.message, {type: "error"});
            setLoading(false);
            return;
        }

        // Show a success message
        toast("Registo criado com sucesso", {type: "success"});

        // Set loading to false
        setLoading(false);

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
                onClose();
                return;
            }

            // Set the registry data
            setEntryData({
                ...(data as OfficerSpecificHoursResponse).data,
                week_start: moment.unix((data as OfficerSpecificHoursResponse).data.week_start),
                week_end: moment.unix((data as OfficerSpecificHoursResponse).data.week_end)
            });
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
            void execute();
        }

        return () => {
            if (!newEntry) {
                setEntryData({
                    id:  0,
                    week_start: moment().day(moment().day() >= 5 ? 5 : -2).subtract(7, "days"),
                    week_end: moment().day(moment().day() >= 5 ? 5 : -2),
                    minutes: 0,
                    submitted_by: 0
                });
            }
        }
    }, [entryId, open]);

    // * Fetch the last entry of the officer when the modal is opened - New entry only
    useEffect(() => {
        if (open && newEntry) {
            // Set the registry data with default values
            setEntryData((draft) => {
                draft.week_start = moment().day(moment().day() >= 5 ? 5 : -2).subtract(7, "days");
                draft.week_end = moment().day(moment().day() >= 5 ? 5 : -2);
            });
        }
    }, [open]);

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title={newEntry ? "Novo Registo - Horas Semanais": `Horas semanais #${entryId}`}
                url={newEntry ? undefined : `/atividade/${officer}/h/${entryId}`}
            >
                {/* Show Loader */}
                <Gate show={loading}>
                    <Loader size={"100px"}/>
                </Gate>

                <Gate show={!loading}>
                    <form onSubmit={handleCreate}>
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
                                        <DefaultDatePicker
                                            disabled={!newEntry}
                                            textWhenDisabled
                                            disableFuture
                                            value={entryData?.week_start}
                                            onChange={(date) => setEntryData((draft) => {
                                                draft.week_start = date;
                                            })}
                                            sx={{width: "150px"}}
                                            slotProps={{
                                                textField: {
                                                    required: true,
                                                    error: entryData.week_start === null || !entryData.week_start.isValid()
                                                }
                                            }}
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
                                        <DefaultDatePicker
                                            disabled={!newEntry}
                                            disableFuture
                                            textWhenDisabled
                                            value={entryData?.week_end}
                                            onChange={(date) => setEntryData((draft) => {
                                                draft.week_end = date;
                                            })}
                                            sx={{width: "150px"}}
                                            slotProps={{
                                                textField: {
                                                    required: true,
                                                    error: entryData.week_end === null || !entryData.week_end.isValid()
                                                }
                                            }}
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
                                        ({toHoursAndMinutes(entryData.minutes)})
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
                                            type={"submit"}
                                            disabled={entryData.week_start === null || !entryData.week_start.isValid() || (entryData.week_end !== null && !entryData.week_end.isValid())}
                                        >
                                            Adicionar Registo
                                        </DefaultButton>
                                    </div>
                                </Gate>
                            </ModalSection>
                        </Gate>
                    </form>
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