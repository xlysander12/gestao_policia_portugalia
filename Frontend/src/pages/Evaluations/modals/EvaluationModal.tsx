import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {Modal, ModalSection} from "../../../components/Modal";
import {getObjectFromId} from "../../../forces-data-context.ts";
import {useForceData} from "../../../hooks";
import {useEffect, useState} from "react";
import {Evaluation, EvaluationDetailResponse} from "@portalseguranca/api-types/officers/evaluations/output";
import Gate from "../../../components/Gate/gate.tsx";
import {Loader} from "../../../components/Loader";
import {toast} from "react-toastify";
import {make_request, RequestMethod} from "../../../utils/requests.ts";
import moment, { Moment } from "moment";
import {PLACEHOLDER_OFFICER_DATA} from "../../../utils/constants.ts";
import {DefaultTypography} from "../../../components/DefaultComponents";
import {Divider} from "@mui/material";
import PatrolInfoModal from "../../Patrols/modals/PatrolInfoModal";

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
    comments: "",
    fields: {}
}

type EvaluationModalProps = {
    open: boolean
    onClose: () => void
    officerNif: number
    id?: number
    newEntry?: boolean
}
function EvaluationModal(props: EvaluationModalProps) {
    // Get force's data from context
    const [forceData] = useForceData();

    // Loading flag
    const [loading, setLoading] = useState<boolean>(true);

    // Edit mode
    const [editMode, setEditMode] = useState<boolean>(false);

    // State that holds the evaluation data
    const [evaluationData, setEvaluationData] = useState<InnerEvaluation>(PLACEHOLDER_EVALUATION_DATA);

    // State that holds the Officer's Data
    // ! Only used when creating a new evaluation
    const [officerData, setOfficerData] = useState<MinifiedOfficerData | null>(null);

    // Patrol Modal control
    const [patrolModalOpen, setPatrolModalOpen] = useState<boolean>(false);

    function handleClose() {
        setLoading(true);
        setEvaluationData(PLACEHOLDER_EVALUATION_DATA);
        props.onClose();
    }

    async function fetchEvaluationData() {
        // Set the loading state to true
        setLoading(true);

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
    }, [props.open, props.id, props.officerNif, props.newEntry]);

    return (
        <>
            <Modal
                title={props.newEntry ?
                    `Adicionar avaliação a ${officerData !== null ? `${getObjectFromId(officerData.patent, forceData.patents)!.name} ${officerData.name}`: `(A carregar...)`}` :
                    `Avaliação #${props.id} - ${!loading ? `${getObjectFromId(evaluationData.target.patent, forceData.patents)!.name} ${evaluationData.target.name}` : `(A carregar...)`}`
                }
                open={props.open}
                onClose={handleClose}
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

                            <Divider />

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                                Patrulha:
                            </DefaultTypography>
                            <DefaultTypography
                                color={evaluationData.patrol === null ? "gray" : "var(--portalseguranca-color-text-light)"}
                                clickable={evaluationData.patrol !== null}
                                onClick={() => {setPatrolModalOpen(true)}}
                            >
                                {evaluationData.patrol === null ? "Sem patrulha associada" : `Patrulha #${localStorage.getItem("force")!.toUpperCase()}${evaluationData.patrol}`}
                            </DefaultTypography>

                            <Divider />
                        </div>
                    </ModalSection>
                </Gate>
            </Modal>

            <PatrolInfoModal
                id={evaluationData.patrol ? `${localStorage.getItem("force")}${evaluationData.patrol}`: null}
                open={patrolModalOpen}
                onClose={() => setPatrolModalOpen(false)}
            />
        </>
    );
}

export default EvaluationModal;