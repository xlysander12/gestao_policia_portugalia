import {useContext, useEffect, useState} from "react";
import {
    OfficerJustification,
    OfficerJustificationDetailsResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {toast} from "react-toastify";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal/modal.tsx";
import {make_request} from "../../../../utils/requests.ts";
import Gate from "../../../../components/Gate/gate.tsx";
import Loader from "../../../../components/Loader/loader.tsx";
import {ForceDataContext} from "../../../../force-data-context.ts";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types/index.ts";
import style from "./index.module.css";
import {Checkbox, Divider, FormControlLabel, MenuItem} from "@mui/material";
import {
    DefaultButton,
    DefaultSelect,
    DefaultTextField,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {useImmer} from "use-immer";
import { AddOfficerJusitificationBodyType } from "@portalseguranca/api-types/officers/activity/input.ts";

const justificationDataDefault: OfficerJustification = {
    id: 0,
    type: 0,
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
    timestamp: new Date().getTime(),
    status: "pending",
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
    const forceData = useContext(ForceDataContext);

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

    // Set the state with the data of the justification
    const [justificationData, setJustificationData] = useImmer<OfficerJustification>(justificationDataDefault);

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
            setJustificationData((data as OfficerJustificationDetailsResponse).data);

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
    async function handleApproveOrReject(approve: boolean) {
        // Set the loading to true
        setLoading(true);

        // Make the request to change the state of the justification
        const response = await make_request(`/officers/${officerNif}/activity/justifications/${justificationId}`, "POST", {
            body: {
                "approved": approve
            }
        });

        // Parse the response
        const data: RequestError | RequestSuccess = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // Set the need to reload to true to fetch the data again
        setNeedsReload(true);
    }

    // Function to handle the submission of the changes
    async function handleSaveChanges() {
        // Set the loading to true
        setLoading(true);

        // Set the edit mode to false
        setEditMode(false);

        // Make the request to change the state of the justification
        const response = await make_request(`/officers/${officerNif}/activity/justifications/${justificationId}`, "PATCH", {
            body: {
                "type": justificationData?.type,
                "start": justificationData?.start,
                "end": justificationData?.end,
                "description": justificationData?.description.trim()
            }
        });

        // Parse the response
        const data: RequestError | RequestSuccess = await response.json();

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
        const data: RequestError | RequestSuccess = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // If the response was positive, close the modal with the details of the justification
        if (response.ok) {
            onClose();
        }
    }

    // Function to handle the creation of a justification
    async function handleCreate() {
        // Set the loading to true
        setLoading(true);

        // Make the request to create the justification
        const response = await make_request(`/officers/${officerNif}/activity/justifications`, "POST", {
            body: {
                "type": justificationData?.type,
                "start": justificationData?.start,
                "end": justificationData?.end,
                "description": justificationData?.description.trim()
            } as AddOfficerJusitificationBodyType
        });

        // Parse the response
        const data: RequestError | RequestSuccess = await response.json();

        // Show toast with the message
        toast(data.message, {type: response.ok ? "success" : "error"});

        // If the response was positive, close the modal with the details of the justification
        if (response.ok) {
            onClose();
        }
    }

    return (
        <>
            <Modal open={open} onClose={onClose}
                   title={newEntry ? "Nova Justificação de Inatividade" : `Justificação de Inatividade #${justificationId}`}
                   width={"55%"}>
                <Gate show={loading}>
                    <Loader size={"100px"}/>
                </Gate>

                <Gate show={!loading}>
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
                            </Gate>
                            {/* Type */}
                            <DefaultTypography
                                color={"var(--portalseguranca-color-accent)"}
                                fontSize={"medium"}
                                fontWeight={"bold"}
                            >
                                Tipo de Inatividade:
                            </DefaultTypography>
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

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

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
                                {new Date(justificationData?.timestamp).toLocaleString()}
                            </DefaultTypography>

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
                                    <DefaultTextField
                                        disabled={!editMode && !newEntry}
                                        sameTextColorWhenDisabled
                                        type={"date"}
                                        value={justificationData?.start}
                                        onChange={(e) => {
                                            setJustificationData((draft) => {
                                                draft!.start = e.target.value;
                                            });
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
                                        <DefaultTextField
                                            disabled={!editMode && !newEntry}
                                            sameTextColorWhenDisabled
                                            type={"date"}
                                            value={justificationData?.end}
                                            onChange={(e) => {
                                                setJustificationData((draft) => {
                                                    draft!.end = e.target.value;
                                                });
                                            }}
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
                                                draft!.end = e.target.checked ? null : new Date().toISOString().split("T")[0];
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
                            <DefaultTextField
                                disabled={!editMode && !newEntry}
                                sameTextColorWhenDisabled
                                multiline
                                value={justificationData?.description}
                                onChange={(e) => {
                                    setJustificationData((draft) => {
                                        draft!.description = e.target.value;
                                    });
                                }}
                                sx={{width: "100%", marginBottom: "10px"}}
                            />
                        </div>
                    </ModalSection>

                    <Gate
                        show={loggedUser.intents["activity"] || (justificationData !== null && justificationData.status === "pending") || newEntry}>
                        <ModalSection title={"Ações"}>
                            <div className={style.justificationActionsDiv}>
                                {/* Show the regular management buttons when it's not a new entry */}
                                <Gate show={!newEntry}>
                                    <Gate show={editMode}>
                                        {/*Save Changes Button*/}
                                        <DefaultButton
                                            buttonColor={"lightgreen"}
                                            darkTextOnHover
                                            onClick={handleSaveChanges}
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
                                                onClick={() => handleApproveOrReject(true)}
                                                sx={{flex: 1}}
                                            >
                                                Aprovar
                                            </DefaultButton>

                                            <DefaultButton
                                                buttonColor={"red"}
                                                onClick={() => handleApproveOrReject(false)}
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
                                        onClick={handleCreate}
                                        sx={{flex: 1}}
                                    >
                                        Criar Justificação
                                    </DefaultButton>
                                </Gate>
                            </div>
                        </ModalSection>
                    </Gate>
                </Gate>
            </Modal>

            <ConfirmationDialog open={deleteDialogOpen} title={"Apagar Justificação"}
                                text={"Tens a certeza que desejas apagar esta justificação?\n" +
                                    "Esta ação não pode ser revertida"} onConfirm={handleDeleteJustification}
                                onDeny={() => setDeleteDialogOpen(false)}/>
        </>
    );
}

export default InactivityJustificationModal;