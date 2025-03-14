import {FormEvent, useCallback, useContext, useEffect, useState} from "react";
import {
    OfficerActivitySocket,
    OfficerJustification,
    OfficerJustificationDetailsResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {toast} from "react-toastify";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import {make_request} from "../../../../utils/requests.ts";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {RequestError, BaseResponse} from "@portalseguranca/api-types/index.ts";
import style from "./index.module.css";
import {Checkbox, Divider, FormControlLabel, MenuItem, Tooltip} from "@mui/material";
import {
    DefaultButton, DefaultDatePicker, DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {useImmer} from "use-immer";
import {
    AddOfficerJustificationBodyType, ChangeOfficerJustificationBodyType,
    ManageOfficerJustificationBodyType
} from "@portalseguranca/api-types/officers/activity/input.ts";
import {getOfficerFromNif} from "../../../../utils/misc.ts";
import HelpIcon from "@mui/icons-material/Help";
import {useForceData, useWebSocketEvent} from "../../../../hooks";
import moment, {Moment} from "moment";
import JustificationManagementModal from "./JustificationManagementModal.tsx";

type InnerJustificationData = Omit<OfficerJustification, "start" | "end"> & {
    start: Moment | null,
    end: Moment | null
}


const justificationDataDefault: InnerJustificationData = {
    id: 0,
    type: 1,
    start: moment(new Date()),
    end: moment(new Date()),
    timestamp: new Date().getTime(),
    status: "pending",
    comment: undefined,
    managed_by: 0,
    description: ""
}

type InactivityJustificationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: number,
    justificationId: number,
    newEntry?: boolean
}
function InactivityJustificationModal({open, onClose, officerNif, justificationId, newEntry = false}: InactivityJustificationModalProps) {
    // Get the force data from context
    const [forceData] = useForceData();

    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Set the loading state
    const [loading, setLoading] = useState(newEntry);

    // Set the needs reload state
    const [needsReload, setNeedsReload] = useState<boolean>(true);

    // Set the editmode state
    const [editMode, setEditMode] = useState<boolean>(false);

    // Set the state that controls the delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    // Set the state values that controls with management information of the justification
    const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false);
    const [justificationToBeDecision, setJustificationToBeDecision] = useState<boolean | null>(null);

    // Set the state with the data of the justification
    const [justificationData, setJustificationData] = useImmer<InnerJustificationData>(justificationDataDefault);
    const [justificationManagedBy, setJustificationManagedBy] = useState<string | null>(null);

    // Everytime the modal is opened, set the justification data to the default
    useEffect(() => {
        if (open) {
            setJustificationData(justificationDataDefault);
        }
    }, [open]);

    // Everytime the justificationId changes and the modal is opened, fetch the justification data
    useEffect(() => {
        const fetchJustificationData = async () => {
            // Set the loading to true
            setLoading(true);

            // Fetch the data from the API
            const response = await make_request(`/officers/${officerNif}/activity/justifications/${justificationId}`, "GET");

            // Parse the response
            const data: RequestError | OfficerJustificationDetailsResponse = await response.json();

            // Handle possible error
            if (!response.ok) {
                toast(data.message, {type: "error"});
                return;
            }

            // Set the justification data
            setJustificationData({
            ...(data as OfficerJustificationDetailsResponse).data,
                start: moment((data as OfficerJustificationDetailsResponse).data.start),
                end: (data as OfficerJustificationDetailsResponse).data.end ? moment((data as OfficerJustificationDetailsResponse).data.end) : null
            });

            // Fetch the managed by name
            if ((data as OfficerJustificationDetailsResponse).data.managed_by) {
                const managedBy = await getOfficerFromNif((data as OfficerJustificationDetailsResponse).data.managed_by!);
                setJustificationManagedBy(`${getObjectFromId(managedBy.patent, forceData.patents)?.name} ${managedBy.name}`);
            }

            // Set the need to reload to false
            setNeedsReload(false);

            // Disable loading
            setLoading(false);
        }

        if (open && needsReload && !newEntry) {
            fetchJustificationData();
        }

        if (!open) { // Ensure that the needsReload is set to true when the modal is closed so it loads the data again when opened
            setNeedsReload(true);
            setEditMode(false);
        }
    }, [justificationId, open, needsReload]);

    // Function to handle the approve or reject button
    async function handleApproveOrReject(approve: boolean, comment?: string) {
        // Set the loading to true
        setLoading(true);

        // Make the request to change the state of the justification
        const response = await make_request<ManageOfficerJustificationBodyType>(`/officers/${officerNif}/activity/justifications/${justificationId}`, "POST", {
            body: {
                approved: approve,
                comment: comment
            }
        });

        // Parse the response
        const data: RequestError | BaseResponse = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // Set the need to reload to true to fetch the data again
        setNeedsReload(true);
    }

    // Function to handle the submission of the changes
    async function handleSaveChanges(event: FormEvent) {
        // Prevent the default form submission
        event.preventDefault();

        // Set the loading to true
        setLoading(true);

        // Set the edit mode to false
        setEditMode(false);

        // Make the request to change the state of the justification
        const response = await make_request<ChangeOfficerJustificationBodyType>(`/officers/${officerNif}/activity/justifications/${justificationId}`, "PATCH", {
            body: {
                type: justificationData?.type,
                start: justificationData?.start!.format("YYYY-MM-DD"),
                end: justificationData?.end ? justificationData?.end.format("YYYY-MM-DD") : null,
                description: justificationData?.description.trim(),
                comment: justificationData?.comment
            }
        });

        // Parse the response
        const data: BaseResponse = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // Set the need to reload to true to fetch the data again
        setNeedsReload(true);
    }

    // Function to handle the deletion of the justification
    async function handleDeleteJustification() {
        // Close the delete confirmation dialog
        setDeleteDialogOpen(false);

        // Set the loading to true
        setLoading(true);

        // Make the request to delete the justification
        const response = await make_request(`/officers/${officerNif}/activity/justifications/${justificationId}`, "DELETE");

        // Parse the response
        const data: RequestError | BaseResponse = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // If the response was positive, close the modal with the details of the justification
        if (response.ok) {
            onClose();
        }
    }

    // Function to handle the creation of a justification
    async function handleCreate(event: FormEvent) {
        // Prevent the default form submission
        event.preventDefault();

        // Set the loading to true
        setLoading(true);

        // Make the request to create the justification
        const response = await make_request<AddOfficerJustificationBodyType>(`/officers/${officerNif}/activity/justifications`, "POST", {
            body: {
                type: justificationData?.type,
                start: justificationData?.start!.format("YYYY-MM-DD"),
                end: justificationData?.end ? justificationData?.end.format("YYYY-MM-DD") : null,
                description: justificationData?.description.trim()
            }
        });

        // Parse the response
        const data: RequestError | BaseResponse = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // If the response was positive, close the modal with the details of the justification
        if (response.ok) {
            onClose();
        }
    }

    // Handle websocket events
    useWebSocketEvent<OfficerActivitySocket>("activity", useCallback(async (data) => {
        // If the event is not about inactivity justifications, it doesn't matter
        if (data.type !== "justification") return;

        // If the event is the addition of a justification, it doesn't matter
        if (data.action === "add") return;

        // If the associated id is not the same as the one of the justification, it doesn't matter
        if (data.id !== justificationId) return;

        // If the user just edited the current justification, don't update on top of it
        if (data.by === loggedUser.info.personal.nif) return;

        if ((data.action === "update" || data.action === "manage") && !editMode) { // If the user is editing the justification, don't update on top of it
            // Set the need to reload to true to fetch the data again
            setNeedsReload(true);

            // Show toast with the message
            toast.warning("A justificação que estavas a visualizar foi alterada!");

            return;
        }

        if (data.action === "delete") {
            // Close the modal
            onClose();

            // Show toast with the message
            toast.warning("A justificação que estavas a visualizar foi apagada!");
        }
    }, [justificationId, loggedUser.info.personal.nif]));

    return (
        <>
            <Modal open={open} onClose={onClose}
                   title={newEntry ? "Nova Justificação de Inatividade" : `Justificação de Inatividade #${justificationId}`}
                   width={"55%"}>
                <Gate show={loading}>
                    <Loader size={"100px"}/>
                </Gate>

                <Gate show={!loading}>
                    <form onSubmit={newEntry ? handleCreate: handleSaveChanges}>
                        <ModalSection title={"Detalhes"}>
                            <div className={style.justificationDetailsOuterDiv}>
                                {/* Only show the status option if it's not a new entry*/}
                                <Gate show={!newEntry}>
                                    {/* Status */}
                                    <DefaultTypography
                                        color={"var(--portalseguranca-color-accent)"}
                                        fontSize={"medium"}
                                        fontWeight={"bold"}
                                    >Estado:
                                    </DefaultTypography>
                                    <DefaultTypography
                                        color={justificationData?.status === "pending" ? "#efc032" : justificationData?.status === "approved" ? "#00ff00" : "#ff0000"}
                                        sx={{marginBottom: "10px"}}
                                    >
                                        {justificationData?.status === "pending" ? "Pendente" : justificationData?.status === "approved" ? "Aprovada" : "Rejeitada"}
                                    </DefaultTypography>

                                    <Divider flexItem sx={{marginBottom: "5px"}}/>

                                    <Gate show={justificationData?.status !== "pending"}>
                                        <DefaultTypography
                                            color={"var(--portalseguranca-color-accent)"}
                                            fontSize={"medium"}
                                            fontWeight={"bold"}
                                        >
                                            {justificationData?.status === "approved" ? "Aprovada" : "Rejeitada"} por:
                                        </DefaultTypography>
                                        <DefaultTypography
                                            sx={{marginBottom: "10px"}}
                                        >
                                            {justificationManagedBy ? justificationManagedBy : "N/A"}
                                        </DefaultTypography>

                                        <Divider flexItem sx={{marginBottom: "5px"}}/>
                                    </Gate>
                                </Gate>
                                {/* Type */}
                                <DefaultTypography
                                    color={"var(--portalseguranca-color-accent)"}
                                    fontSize={"medium"}
                                    fontWeight={"bold"}
                                >
                                    Tipo de Inatividade:
                                </DefaultTypography>
                                <div className={style.justificationDurationRowDiv}>
                                    <DefaultSelect
                                        fullWidth={false}
                                        disabled={!editMode && !newEntry}
                                        sameTextColorWhenDisabled
                                        value={justificationData?.type}
                                        onChange={(e) => {
                                            setJustificationData((draft) => {
                                                draft!.type = e.target.value as number;
                                            });
                                        }}
                                        sx={{minWidth: "152px", textAlign: "start", marginBottom: "10px"}}
                                    >
                                        {forceData.inactivity_types.map((type) => {
                                            return (
                                                <MenuItem
                                                    key={`modalInactivityType${type.id}`}
                                                    value={type.id}
                                                >
                                                    {type.name}
                                                </MenuItem>
                                            )
                                        })};
                                    </DefaultSelect>

                                    <Tooltip
                                        title={getObjectFromId(justificationData.type, forceData.inactivity_types)?.description}
                                        arrow
                                        describeChild
                                        placement={"right"}
                                        componentsProps={{
                                            tooltip: {
                                                sx: {
                                                    whiteSpace: "pre-line",
                                                    fontSize: "14px"
                                                }
                                            }
                                        }}
                                    >
                                        <HelpIcon />
                                    </Tooltip>
                                </div>

                                <Divider flexItem sx={{marginBottom: "5px"}}/>

                                <Gate show={!newEntry}>
                                    {/* Submission date */}
                                    <DefaultTypography
                                        color={"var(--portalseguranca-color-accent)"}
                                        fontSize={"medium"}
                                        fontWeight={"bold"}
                                    >
                                        Data de Submissão:
                                    </DefaultTypography>
                                    <DefaultTypography
                                        sx={{marginBottom: "10px"}}
                                    >
                                        {moment(justificationData?.timestamp).format("dddd, DD/MM/YYYY, HH:mm")}
                                    </DefaultTypography>

                                    <Divider flexItem sx={{marginBottom: "5px"}}/>
                                </Gate>

                                {/* Duration */}
                                <div className={style.justificationDurationRowDiv}>
                                    {/* Start Date */}
                                    <div className={style.justificationDetailsDurationDiv}>
                                        <DefaultTypography
                                            color={"var(--portalseguranca-color-accent)"}
                                            fontSize={"medium"}
                                            fontWeight={"bold"}
                                        >
                                            Data de Início:
                                        </DefaultTypography>
                                        <DefaultDatePicker
                                            disabled={!editMode && !newEntry}
                                            textWhenDisabled
                                            value={moment(justificationData?.start)}
                                            onChange={(date) => {
                                                setJustificationData((draft) => {
                                                    draft!.start = date;
                                                });
                                            }}
                                            sx={{width: "150px"}}
                                            slotProps={{
                                                textField: {
                                                    required: true,
                                                    error: justificationData.start === null || !justificationData.start.isValid()
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div className={style.justificationDetailsDurationDiv}>
                                        <Gate show={justificationData?.end !== null}>
                                            <DefaultTypography
                                                color={"var(--portalseguranca-color-accent)"}
                                                fontSize={"medium"}
                                                fontWeight={"bold"}
                                                sx={{marginRight: "38px"}}
                                            >
                                                Data de Fim:
                                            </DefaultTypography>
                                            <DefaultDatePicker
                                                disabled={!editMode && !newEntry}
                                                textWhenDisabled
                                                value={justificationData?.end}
                                                onChange={(date) => {
                                                    setJustificationData((draft) => {
                                                        draft!.end = date;
                                                    });
                                                }}
                                                sx={{width: "150px"}}
                                            />
                                        </Gate>
                                    </div>
                                </div>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={justificationData?.end === null}
                                            onChange={(e) => {
                                                setJustificationData((draft) => {
                                                    draft!.end = e.target.checked ? null : moment(new Date());
                                                });
                                            }}
                                            disabled={!editMode && !newEntry}
                                            sx={{
                                                "&.MuiCheckbox-root.Mui-disabled": {
                                                    color: "var(--portalseguranca-color-accent)"
                                                }
                                            }}
                                        />
                                    }
                                    label={"Inatividade Indeterminada"}
                                    sx={{
                                        marginRight: "4px", color: "var(--portalseguranca-color-text-light)",
                                        "& .MuiFormControlLabel-label.Mui-disabled": {
                                            color: "var(--portalseguranca-color-text-light)"
                                        }
                                    }}
                                />

                                <Divider flexItem sx={{marginBottom: "5px"}}/>

                                {/* Description */}
                                <DefaultTypography
                                    color={"var(--portalseguranca-color-accent)"}
                                    fontSize={"medium"}
                                    fontWeight={"bold"}
                                >
                                    Descrição:
                                </DefaultTypography>
                                <DefaultOutlinedTextField
                                    disabled={!editMode && !newEntry}
                                    required
                                    textWhenDisabled
                                    multiline
                                    value={justificationData?.description}
                                    onChange={(e) => {
                                        setJustificationData((draft) => {
                                            draft!.description = e.target.value;
                                        });
                                    }}
                                    sx={{width: "100%", marginBottom: "10px"}}
                                />

                                {/* Management Comment */}
                                <Gate show={justificationData?.comment !== undefined}>

                                    <Divider flexItem sx={{marginBottom: "5px"}}/>

                                    <DefaultTypography
                                        color={"var(--portalseguranca-color-accent)"}
                                        fontSize={"medium"}
                                        fontWeight={"bold"}
                                    >
                                        Decisão:
                                    </DefaultTypography>
                                    <DefaultOutlinedTextField
                                        disabled={!editMode && !newEntry}
                                        required
                                        textWhenDisabled
                                        multiline
                                        value={justificationData?.comment}
                                        onChange={(e) => {
                                            setJustificationData((draft) => {
                                                draft!.comment = e.target.value;
                                            });
                                        }}
                                        sx={{width: "100%", marginBottom: "10px"}}
                                    />
                                </Gate>
                            </div>
                        </ModalSection>

                        <Gate
                            show={loggedUser.intents["activity"] || (justificationData.status === "pending") || newEntry}>
                            <ModalSection title={"Ações"}>
                                <div className={style.justificationActionsDiv}>
                                    {/* Show the regular management buttons when it's not a new entry */}
                                    <Gate show={!newEntry}>
                                        <Gate show={editMode}>
                                            {/*Save Changes Button*/}
                                            <DefaultButton
                                                buttonColor={"lightgreen"}
                                                darkTextOnHover
                                                type={"submit"}
                                                sx={{flex: 1}}
                                            >
                                                Guardar Alterações
                                            </DefaultButton>

                                            {/*Cancel Button*/}
                                            <DefaultButton
                                                buttonColor={"red"}
                                                onClick={() => {
                                                    setEditMode(false);
                                                    setNeedsReload(true)
                                                }}
                                                sx={{flex: 1}}
                                            >
                                                Cancelar
                                            </DefaultButton>
                                        </Gate>

                                        {/*Other Buttons can't appear if editmode is on*/}
                                        <Gate show={!editMode}>
                                            {/*Aprove or Deny buttons must only appear if the logged user has the activity intent
                                                and the justification is pending*/}
                                            <Gate
                                                show={loggedUser.intents["activity"] && justificationData?.status === "pending"}>
                                                <DefaultButton
                                                    buttonColor={"lightgreen"}
                                                    darkTextOnHover
                                                    onClick={() => {
                                                        setJustificationToBeDecision(true);
                                                        setCommentDialogOpen(true);
                                                    }}
                                                    sx={{flex: 1}}
                                                >
                                                    Aprovar
                                                </DefaultButton>

                                                <DefaultButton
                                                    buttonColor={"red"}
                                                    onClick={() => {
                                                        setJustificationToBeDecision(false);
                                                        setCommentDialogOpen(true);
                                                    }}
                                                    sx={{flex: 1}}
                                                >
                                                    Rejeitar
                                                </DefaultButton>
                                            </Gate>

                                            <Gate
                                                show={justificationData?.status === "pending" || loggedUser.intents["activity"]}>
                                                <DefaultButton onClick={() => setEditMode(true)}
                                                               sx={{flex: 1}}>Editar</DefaultButton>
                                                <DefaultButton buttonColor={"red"}
                                                               onClick={() => setDeleteDialogOpen(true)}
                                                               sx={{flex: 1}}>Apagar</DefaultButton>
                                            </Gate>
                                        </Gate>
                                    </Gate>

                                    <Gate show={newEntry}>
                                        <DefaultButton
                                            buttonColor={"lightgreen"}
                                            darkTextOnHover
                                            type={"submit"}
                                            sx={{flex: 1}}
                                        >
                                            Criar Justificação
                                        </DefaultButton>
                                    </Gate>
                                </div>
                            </ModalSection>
                        </Gate>
                    </form>
                </Gate>
            </Modal>

            <JustificationManagementModal
                open={commentDialogOpen}
                onClose={() => {
                    setCommentDialogOpen(false);
                    setJustificationToBeDecision(null);
                }}
                approve={!!justificationToBeDecision}
                callback={(comment) => handleApproveOrReject(!!justificationToBeDecision, comment)}
            />

            <ConfirmationDialog open={deleteDialogOpen} title={"Apagar Justificação"}
                                text={"Tens a certeza que desejas apagar esta justificação?\n" +
                                    "\n" +
                                    "Esta ação não pode ser revertida!"} onConfirm={handleDeleteJustification}
                                onDeny={() => setDeleteDialogOpen(false)}
            />
        </>
    );
}

export default InactivityJustificationModal;