import InformationCard from "../../../../../components/InformationCard";
import {InnerMinifiedDecision} from "./DecisionsListModal.tsx";
import {getObjectFromId} from "../../../../../forces-data-context.ts";
import {useForceData} from "../../../../../hooks";
import styles from "./card-styles.module.css";
import {DefaultTypography} from "../../../../../components/DefaultComponents";
import moment from "moment";

type DecisionCardProps = {
    callback: () => void
    decision: InnerMinifiedDecision
}
function DecisionCard(props: DecisionCardProps) {
    const [forceData] = useForceData();

    return (
        <InformationCard
            callback={props.callback}
            statusColor={props.decision.decision ? getObjectFromId(props.decision.decision, forceData.evaluation_decisions)!.color : undefined}
        >
            <div className={styles.decisionCardMain}>
                <DefaultTypography
                    fontSize={"larger"}
                >
                    Decisão para a cerimónia de {props.decision.ceremony_event.start.format("DD/MM/YYYY")} {props.decision.ceremony_event.start.isAfter(moment()) ? `(${props.decision.ceremony_event.start.calendar()})` : ""}
                </DefaultTypography>

                <DefaultTypography
                    color={"gray"}
                >
                    Categoria: {getObjectFromId(props.decision.category, forceData.patentCategories)!.name}
                </DefaultTypography>
            </div>
        </InformationCard>
    );
}

export function MockDecisionCard() {
    return (
        <InformationCard
            disabled
            callback={() => {}}
        >
            <div className={`${styles.decisionCardMain} ${styles.decisionCardMock}`}>
                <DefaultTypography
                    fontSize={"larger"}
                >
                    Decisão para a cerimónia de Dia de São Nunca à Tarde
                </DefaultTypography>

                <DefaultTypography
                    color={"gray"}
                >
                    Categoria: Absolutamente Nenhuma
                </DefaultTypography>
            </div>
        </InformationCard>
    );
}

export default DecisionCard;