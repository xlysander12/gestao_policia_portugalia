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
import {Checkbox, Divider, FormControlLabel, MenuItem, Typography} from "@mui/material";
import {DefaultButton, DefaultSelect, DefaultTextField} from "../../../../components/DefaultComponents";
import {useImmer} from "use-immer";
import ScreenSplit from "../../../../components/ScreenSplit/screen-split.tsx";

type InactivityJustificationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: number,
    justificationId: number,
}
function InactivityJustificationModal({open, onClose, officerNif, justificationId}: InactivityJustificationModalProps) {
    // Get the force data from context
    const forceData = useContext(ForceDataContext);

    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Set the loading state
    const [loading, setLoading] = useState(true);

    // Set the needs reload state
    const [needsReload, setNeedsReload] = useState<boolean>(true);

    // Set the editmode state
    const [editMode, setEditMode] = useState<boolean>(false);

    // Set the state that controls the delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    // Set the state with the data of the justification
    const [justificationData, setJustificationData] = useImmer<OfficerJustification | null>(null);

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

        if (open && needsReload) {
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

    return (
        <Modal open={open} onClose={onClose} title={`Justificação de Inatividade #${justificationId}`} width={"55%"}>
            <Gate show={loading}>
                <Loader size={"100px"} />
            </Gate>

            <Gate show={!loading}>
                <ModalSection title={"Detalhes"}>
                    <div className={style.justificationDetailsOuterDiv}>
                        {/* Status */}
                        <Typography
                            color={"var(--portalseguranca-color-accent)"}
                            fontSize={"medium"}
                            fontWeight={"bold"}
                        >Estado:
                        </Typography>
                        <Typography
                            color={justificationData?.status === "pending" ? "#efc032" : justificationData?.status === "approved" ? "#00ff00" : "#ff0000"}
                            sx={{marginBottom: "10px"}}
                        >
                            {justificationData?.status === "pending" ? "Pendente" : justificationData?.status === "approved" ? "Aprovada" : "Rejeitada"}
                        </Typography>

                        <Divider flexItem sx={{marginBottom: "5px"}}/>

                        {/* Type */}
                        <Typography
                            color={"var(--portalseguranca-color-accent)"}
                            fontSize={"medium"}
                            fontWeight={"bold"}
                        >
                            Tipo de Inatividade:
                        </Typography>
                        <DefaultSelect
                            fullWidth={false}
                            disabled={!editMode}
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

                        {/* Duration */}
                        <div style={{width: "100%", marginBottom: "10px"}}>
                            <ScreenSplit leftSideComponent={
                                // Start Date
                                <div className={style.justificationDetailsDurationStartDiv}>
                                    <Typography
                                        color={"var(--portalseguranca-color-accent)"}
                                        fontSize={"medium"}
                                        fontWeight={"bold"}
                                    >
                                        Data de Início:
                                    </Typography>
                                    <DefaultTextField
                                        disabled={!editMode}
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
                            } leftSidePercentage={50}>
                                {/* End Date */}
                                <div className={style.justificationDetailsDurationEndDiv}>
                                    <Gate show={justificationData?.end !== null}>
                                        <Typography
                                            color={"var(--portalseguranca-color-accent)"}
                                            fontSize={"medium"}
                                            fontWeight={"bold"}
                                            sx={{marginRight: "38px"}}
                                        >
                                            Data de Fim:
                                        </Typography>
                                        <DefaultTextField
                                            disabled={!editMode}
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
                            </ScreenSplit>

                            <div className={style.justificationDetailsDurationStartDiv}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={justificationData?.end === null}
                                            onChange={(e) => {
                                                setJustificationData((draft) => {
                                                    draft!.end = e.target.checked ? null : new Date().toISOString().split("T")[0];
                                                });
                                            }}
                                            disabled={!editMode}
                                            sx={{
                                                "&.MuiCheckbox-root.Mui-disabled": {
                                                    color: "var(--portalseguranca-color-accent)"
                                                }
                                            }}
                                        />
                                    }
                                    label={"Inatividade Indeterminada"}
                                    sx={{marginRight: "4px", color: "var(--portalseguranca-color-text-light)",
                                        "& .MuiFormControlLabel-label.Mui-disabled": {
                                            color: "var(--portalseguranca-color-text-light)"
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <Divider flexItem sx={{marginBottom: "5px"}}/>

                        {/* Description */}
                        <Typography
                            color={"var(--portalseguranca-color-accent)"}
                            fontSize={"medium"}
                            fontWeight={"bold"}
                        >
                            Descrição:
                        </Typography>
                        <DefaultTextField
                            disabled={!editMode}
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

                <Gate show={loggedUser.intents["activity"] || (justificationData !== null && justificationData.status === "pending")}>
                    <ModalSection title={"Ações"}>
                        <div className={style.justificationActionsDiv}>
                            <Gate show={editMode}>
                                {/*Save Changes Button*/}
                                <DefaultButton
                                    buttonColor={"lightgreen"}
                                    darkTextOnHover
                                    onClick={handleSaveChanges}
                                >
                                    Guardar Alterações
                                </DefaultButton>

                                {/*Cancel Button*/}
                                <DefaultButton
                                    buttonColor={"red"}
                                    onClick={() => {setEditMode(false); setNeedsReload(true)}}
                                >
                                    Cancelar
                                </DefaultButton>
                            </Gate>

                            {/*Other Buttons can't appear if editmode is on*/}
                            <Gate show={!editMode}>
                                {/*Aprove or Deny buttons must only appear if the logged user has the activity intent
                                and the justification is pending*/}
                                <Gate show={loggedUser.intents["activity"] && justificationData?.status === "pending"}>
                                    <DefaultButton
                                        buttonColor={"lightgreen"}
                                        darkTextOnHover
                                        onClick={() => handleApproveOrReject(true)}
                                    >
                                        Aprovar
                                    </DefaultButton>

                                    <DefaultButton
                                        buttonColor={"red"}
                                        onClick={() => handleApproveOrReject(false)}
                                    >
                                        Rejeitar
                                    </DefaultButton>
                                </Gate>

                                <Gate show={justificationData?.status === "pending" || loggedUser.intents["activity"]}>
                                    <DefaultButton onClick={() => setEditMode(true)}>Editar</DefaultButton>
                                    <DefaultButton buttonColor={"red"} onClick={() => setDeleteDialogOpen(true)}>Apagar</DefaultButton>
                                </Gate>
                            </Gate>
                        </div>
                    </ModalSection>
                </Gate>
            </Gate>

            <ConfirmationDialog open={deleteDialogOpen} title={"Apagar Justificação"} text={"Tens a certeza que desejas apagar esta justificação?\n" +
                "Esta ação não pode ser revertida"} onConfirm={handleDeleteJustification} onDeny={() => setDeleteDialogOpen(false)} />
        </Modal>
    )
}

export default InactivityJustificationModal;