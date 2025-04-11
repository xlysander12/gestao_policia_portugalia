import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {useForceData} from "../../../../hooks";
import {useEffect, useState} from "react";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import {toast} from "react-toastify";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import moment, { Moment } from "moment";
import {PLACEHOLDER_OFFICER_DATA} from "../../../../utils/constants.ts";
import {
    DefaultButton,
    DefaultDateTimePicker,
    DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {Divider, IconButton, MenuItem} from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
import PatrolInfoModal from "../../../Patrols/modals/PatrolInfoModal";
import {useImmer} from "use-immer";
import { MinifiedOfficerData, OfficerInfoGetResponse } from "@portalseguranca/api-types/officers/output";
import {Evaluation, EvaluationDetailResponse } from "@portalseguranca/api-types/officers/evaluations/output";
import { EditEvaluationBodyType } from "@portalseguranca/api-types/officers/evaluations/input";
import AddEvaluationSection from "./AddEvaluationSection";
import { BaseResponse } from "@portalseguranca/api-types";

type InnerEvaluation = Omit<Evaluation, "target" | "author" | "timestamp"> & {
    target: MinifiedOfficerData
    author: MinifiedOfficerData
    timestamp: Moment
}

const PLACEHOLDER_EVALUATION_DATA: InnerEvaluation = {
    id: -1,
    timestamp: moment(),
    author: PLACEHOLDER_OFFICER_DATA.minified,
    target: PLACEHOLDER_OFFICER_DATA.minified,
    patrol: null,
    comments: null,
    decision: null,
    fields: {}
}

type EvaluationModalProps = {
    open: boolean
    onClose: () => void
    officerNif: number
    officerData?: MinifiedOfficerData
    id?: number
    newEntry?: boolean
}
function EvaluationModal(props: EvaluationModalProps) {
    // Ensure the officerData prop must be defined if this is a new Entry
    if (props.newEntry && !props.officerData) {
        throw new Error("officerData prop must be passed when creating a new evaluation");
    }

    // Get force's data from context
    const [forceData] = useForceData();

    // Loading flag
    const [loading, setLoading] = useState<boolean>(true);

    // Edit mode
    const [editMode, setEditMode] = useState<boolean>(false);

    // State that holds the evaluation data
    const [evaluationData, setEvaluationData] = useImmer<InnerEvaluation>(PLACEHOLDER_EVALUATION_DATA);

    // Patrol Modal control
    const [patrolModalOpen, setPatrolModalOpen] = useState<boolean>(false);

    // Confirmation Dialog controll
    const [confirmationDialogOpen, setConfirmationDialogOpen] = useState<boolean>(false);

    function handleClose() {
        setLoading(true);
        setEvaluationData(PLACEHOLDER_EVALUATION_DATA);
        props.onClose();
    }

    async function fetchEvaluationData(showLoading = true) {
        // Set the loading state to true
        if (showLoading) {
            setLoading(true);
        }

        // Fetch the evaluation data
        const response = await make_request(`/officers/${props.officerNif}/evaluations/${props.id}`, RequestMethod.GET);
        const responseJson = await response.json() as EvaluationDetailResponse;
        
        if (!response.ok) {
            toast.error(responseJson.message);
            handleClose();
            return;
        }

        const evaluationData = responseJson.data;

        // Once having the data, fetch the author's and target's data
        const authorResponse = await make_request(`/officers/${evaluationData.author}`, RequestMethod.GET);
        const authorResponseJson = await authorResponse.json() as OfficerInfoGetResponse;

        if (!authorResponse.ok) {
            toast.error(authorResponseJson.message);
            handleClose();
            return;
        }

        const targetResponse = await make_request(`/officers/${evaluationData.target}`, RequestMethod.GET);
        const targetResponseJson = await targetResponse.json() as OfficerInfoGetResponse;

        if (!targetResponse.ok) {
            toast.error(targetResponseJson.message);
            handleClose();
            return;
        }

        // Set the evaluation data
        setEvaluationData({
            ...evaluationData,
            author: authorResponseJson.data,
            target: targetResponseJson.data,
            timestamp: moment.unix(evaluationData.timestamp)
        });

        // Set the loading state to false
        setLoading(false);
    }

    async function handleEvaluationSave() {
        // Set the loading state to true
        setLoading(true);

        // Query the server to save the evaluation
        const response = await make_request<EditEvaluationBodyType>(`/officers/${props.officerNif}/evaluations/${evaluationData.id}`, RequestMethod.PATCH, {
            body: {
                patrol: evaluationData.patrol,
                comments: evaluationData.comments,
                decision: evaluationData.decision,
                timestamp: evaluationData.timestamp.unix(),
                fields: evaluationData.fields
            }
        });
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        toast.success("Avaliação guardada com sucesso!");

        // Fetch the evaluation data again
        await fetchEvaluationData();
    }

    async function handleEvaluationDelete() {
        // Set the loading state to true
        setLoading(true);

        // Query the server to delete the evaluation
        const response = await make_request(`/officers/${props.officerNif}/evaluations/${props.id}`, RequestMethod.DELETE);
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }
        toast.success("Avaliação apagada com sucesso!");

        // Close the modal
        handleClose();
    }

    useEffect(() => {
        if (props.open) {
            if (props.id) { // If ID is set, then we are viewing an existing evaluation
                void fetchEvaluationData();
            }

            if (props.newEntry) { // If the newEntry flag is true, this is a new evaluation
                // Ensure the evaluationData is set to the placeholder
                setEvaluationData(PLACEHOLDER_EVALUATION_DATA);

                // Set the editmode to true
                setEditMode(true);
            }
        }

        return () => {
            // Reset flags
            setEditMode(false);
            setLoading(true);
        }
    }, [props.open, props.id, props.officerNif, props.newEntry]);

    return (
        <>
            <Modal
                title={props.newEntry ?
                    `Adicionar avaliação a ${getObjectFromId(props.officerData!.patent, forceData.patents)!.name} ${props.officerData!.name}` :
                    `Avaliação #${props.id} - ${!loading ? `${getObjectFromId(evaluationData.target.patent, forceData.patents)!.name} ${evaluationData.target.name}` : `(A carregar...)`}`
                }
                open={props.open}
                onClose={handleClose}
                width={"50%"}
            >
                <Gate show={loading}>
                    <Loader fullDiv size={"98px"}></Loader>
                </Gate>

                <Gate show={!loading}>
                    <ModalSection
                        title={"Detalhes gerais"}
                    >
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            justifyContent: "flex-start"
                        }}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                Autor:
                            </DefaultTypography>
                            <DefaultTypography>
                                {getObjectFromId(evaluationData.author.patent, forceData.patents)?.name} {evaluationData.author.name}
                            </DefaultTypography>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                Patrulha:
                            </DefaultTypography>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: "5px"
                                }}
                            >
                                <DefaultTypography
                                    color={evaluationData.patrol === null && !editMode ? "gray" : "var(--portalseguranca-color-text-light)"}
                                    clickable={evaluationData.patrol !== null || editMode}
                                    onClick={evaluationData.patrol !== null ? () => {setPatrolModalOpen(true)} : () => {}}
                                >
                                    {evaluationData.patrol === null ? (editMode ? "Associar Patrulha" : "Sem patrulha associada") : `Patrulha #${localStorage.getItem("force")!.toUpperCase()}${evaluationData.patrol}`}
                                </DefaultTypography>

                                <Gate show={editMode}>
                                    <Gate show={evaluationData.patrol !== null}>
                                        <IconButton
                                            onClick={() => setEvaluationData(draft => {
                                                draft.patrol = null
                                            })}
                                        >
                                            <ClearIcon sx={{color: "red"}}/>
                                        </IconButton>
                                    </Gate>
                                </Gate>
                            </div>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                Data de Avaliação:
                            </DefaultTypography>
                            <DefaultDateTimePicker
                                disabled={!editMode || evaluationData.patrol !== null}
                                textWhenDisabled={!editMode}
                                value={evaluationData.timestamp}
                                onChange={value => setEvaluationData(draft => {draft.timestamp = value ?? moment(value)})}
                                sx={{width: "50%"}}
                            />

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                Aptidão:
                            </DefaultTypography>
                            <DefaultSelect
                                disabled={!editMode}
                                sameTextColorWhenDisabled
                                value={evaluationData.decision ?? 0}
                                onChange={(event) => setEvaluationData((draft) => {
                                    draft.decision = event.target.value as number !== 0 ? event.target.value as number : null
                                })}
                                sx={{width: "50%", textAlign: "start"}}
                            >
                                {/*Sem decisão*/}
                                <MenuItem
                                    value={0}
                                >
                                    Sem decisão
                                </MenuItem>

                                {forceData.evaluation_decisions.map(decision => {
                                    return (
                                        <MenuItem
                                            key={`decision${decision.id}`}
                                            value={decision.id}
                                        >
                                            {decision.name}
                                        </MenuItem>
                                    );
                                })}
                            </DefaultSelect>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                Observações:
                            </DefaultTypography>
                            <DefaultOutlinedTextField
                                disabled={!editMode}
                                textWhenDisabled
                                fullWidth
                                multiline
                                placeholder={"Sem observações"}
                                value={evaluationData.comments ?? ""}
                                onChange={event => setEvaluationData(draft => {
                                    draft.comments = event.target.value !== "" ? event.target.value : null
                                })}
                            />
                        </div>
                    </ModalSection>

                    {Object.keys(evaluationData.fields).map((field => {
                        return (
                            <ModalSection
                                key={`field${field}`}
                                title={`Campo de Avaliação - ${getObjectFromId(parseInt(field), forceData.evaluation_fields)!.name}`}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        justifyContent: "flex-start"
                                    }}
                                >
                                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                        Avaliação:
                                    </DefaultTypography>
                                    <DefaultSelect
                                        disabled={!editMode}
                                        sameTextColorWhenDisabled
                                        value={evaluationData.fields[parseInt(field)].grade}
                                        onChange={(event) => {
                                            setEvaluationData((draft) => {
                                                draft.fields[parseInt(field)].grade = event.target.value as number
                                            });
                                        }}
                                        sx={{width: "50%", textAlign: "start"}}
                                    >
                                        {forceData.evaluation_grades.map(grade => {
                                            return (
                                                <MenuItem
                                                    key={`grade${grade.id}`}
                                                    value={grade.id}
                                                >
                                                    {grade.name}
                                                </MenuItem>
                                            );
                                        })}
                                    </DefaultSelect>

                                    <Divider flexItem sx={{marginBottom: "5px"}}/>

                                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                        Observações:
                                    </DefaultTypography>
                                    <DefaultOutlinedTextField
                                        disabled={!editMode}
                                        textWhenDisabled
                                        fullWidth
                                        multiline
                                        placeholder={"Sem observações"}
                                        value={evaluationData.fields[parseInt(field)].comments ?? ""}
                                        onChange={event => setEvaluationData(draft => {
                                            draft.fields[parseInt(field)].comments = event.target.value !== "" ? event.target.value : null
                                        })}
                                    />

                                    {/* If editMode is on, show button to remove this field */}
                                    <Gate show={editMode}>
                                        <Divider flexItem sx={{marginBottom: "5px"}}/>

                                        <DefaultButton
                                            buttonColor={"red"}
                                            fullWidth
                                            onClick={() => {
                                                setEvaluationData(draft => {
                                                    delete draft.fields[parseInt(field)];
                                                });
                                            }}
                                        >
                                            Remover Campo
                                        </DefaultButton>
                                    </Gate>

                                </div>
                            </ModalSection>
                        );
                    }))}

                    {/* If editMode is one, show the option to add another evaluation field*/}
                    <Gate show={editMode}>
                        <AddEvaluationSection
                            target={evaluationData.target}
                            addedFields={Object.keys(evaluationData.fields).map(field => parseInt(field))}
                            onAdd={(field) => {
                                setEvaluationData(draft => {
                                    draft.fields[field.id] = {
                                        grade: field.grade,
                                        comments: field.comments
                                    }
                                });
                            }}
                        />
                    </Gate>

                    <ModalSection title={"Ações"}>
                        <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-evenly",
                            width: "100%",
                            gap: "10px"
                        }}
                        >
                            <Gate show={!editMode}>
                                <DefaultButton
                                    sx={{flex: 1}}
                                    onClick={() => {
                                        setEditMode(true);
                                    }}
                                >
                                    Editar
                                </DefaultButton>

                                <DefaultButton
                                    buttonColor={"red"}
                                    sx={{flex: 1}}
                                    onClick={() => {
                                        setConfirmationDialogOpen(true);
                                    }}
                                >
                                    Apagar
                                </DefaultButton>
                            </Gate>

                            <Gate show={editMode}>
                                <DefaultButton
                                    buttonColor={"lightgreen"}
                                    sx={{flex: 1}}
                                    onClick={handleEvaluationSave}
                                >
                                    Guardar
                                </DefaultButton>

                                <DefaultButton
                                    buttonColor={"red"}
                                    sx={{flex: 1}}
                                    onClick={() => {
                                        setEditMode(false);
                                        void fetchEvaluationData();
                                    }}
                                >
                                    Cancelar
                                </DefaultButton>
                            </Gate>
                        </div>
                    </ModalSection>
                </Gate>
            </Modal>

            <ConfirmationDialog
                open={confirmationDialogOpen}
                title={`Apagar avaliação #${evaluationData.id}`}
                text={"Tens a certeza que desejas apagar esta avaliação?\nEsta ação não pode ser revertida!"}
                onConfirm={handleEvaluationDelete}
                onDeny={() => setConfirmationDialogOpen(false)}
            />

            <PatrolInfoModal
                id={evaluationData.patrol ? `${localStorage.getItem("force")}${evaluationData.patrol}`: null}
                open={patrolModalOpen}
                onClose={() => setPatrolModalOpen(false)}
            />
        </>
    );
}

export default EvaluationModal;