import styles from "./evaluation-card.module.css";
import { MinifiedEvaluation } from "@portalseguranca/api-types/officers/evaluations/output";
import InformationCard from "../../../../components/InformationCard";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import { useForceData } from "../../../../hooks/index.ts";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {useEffect, useState} from "react";
import { make_request } from "../../../../utils/requests.ts";
import { toast } from "react-toastify";
import {DefaultTypography} from "../../../../components/DefaultComponents";
import Gate from "../../../../components/Gate/gate.tsx";
import {Skeleton} from "@mui/material";
import moment from "moment";

type EvaluationCardProps = {
    evaluation: MinifiedEvaluation
    callback: (evaluation: MinifiedEvaluation) => void
}
function EvaluationCard(props: EvaluationCardProps) {
    // Get force's data
    const [forceData] = useForceData();

    // State that holds the loading flag
    const [loading, setLoading] = useState<boolean>(true);

    // States that holds the target's and author's data
    const [author, setAuthor] = useState<MinifiedOfficerData | null>(null);
    const [target, setTarget] = useState<MinifiedOfficerData | null>(null);

    async function getEvaluationTargetAuthor() {
        // Set the loading flag to true
        setLoading(true);

        // Get the target object's data
        const targetResponse = await make_request(`/officers/${props.evaluation.target}`, "GET");
        const targetResponseJson = await targetResponse.json() as OfficerInfoGetResponse;

        if (!targetResponse.ok) {
            toast.error(targetResponseJson.message);
            return;
        }

        // Set the target's data
        setTarget(targetResponseJson.data);

        // Get the author's object's data
        const authorResponse = await make_request(`/officers/${props.evaluation.author}`, "GET");
        const authorResponseJson = await authorResponse.json() as OfficerInfoGetResponse;

        if (!targetResponse.ok) {
            toast.error(targetResponseJson.message);
            return;
        }

        // Set the author's data
        setAuthor(authorResponseJson.data);

        // Set the loading flag to false
        setLoading(false);
    }

    useEffect(() => {
        void getEvaluationTargetAuthor();
    }, [props.evaluation.id, props.evaluation.target, props.evaluation.author]);

    return (
        <InformationCard
            callback={props.callback}
            statusColor={props.evaluation.decision ? getObjectFromId(props.evaluation.decision, forceData.evaluation_decisions)!.color : getObjectFromId(props.evaluation.average, forceData.evaluation_grades)!.color}
        >
            <div className={styles.evaluationCardMain}>
                <div className={styles.evaluationCardLeft}>
                    <DefaultTypography fontSize={"larger"}>
                        Avaliação #{props.evaluation.id}
                    </DefaultTypography>

                    <Gate show={loading}>
                        <Skeleton variant={"text"} width={"300px"} height={"25px"}/>
                    </Gate>

                    <Gate show={!loading}>
                        <DefaultTypography color={"gray"}>
                            {target ? getObjectFromId(target?.patent, forceData.patents)!.name : ""} {target?.name}
                        </DefaultTypography>
                    </Gate>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "3px"
                        }}
                    >
                        <DefaultTypography color={"gray"}>
                            Média da Avaliação:
                        </DefaultTypography>

                        <DefaultTypography color={getObjectFromId(props.evaluation.average, forceData.evaluation_grades)!.color}>
                            {getObjectFromId(props.evaluation.average, forceData.evaluation_grades)!.name}
                        </DefaultTypography>
                    </div>

                </div>

                <div className={styles.evaluationCardRight}>
                    <DefaultTypography fontSize={"small"} color={"gray"}>
                        {moment.unix(props.evaluation.timestamp).calendar()}
                    </DefaultTypography>

                    <div
                        style={{
                            marginTop: "auto"
                        }}
                    >
                        <Gate show={loading}>
                            <Skeleton variant={"text"} width={"225px"} />
                        </Gate>

                        <Gate show={!loading}>
                            <DefaultTypography fontSize={"small"} color={"gray"}>
                                {author ? getObjectFromId(author.patent, forceData.patents)!.name: ""} {author?.name}
                            </DefaultTypography>
                        </Gate>
                    </div>
                </div>
            </div>
        </InformationCard>
    );
}

export default EvaluationCard;