import { MinifiedEvent } from "@portalseguranca/api-types/events/output";
import InformationCard from "../InformationCard";
import styles from "./card.module.css";
import {DefaultTypography} from "../DefaultComponents";
import moment from "moment";

type EventCardProps = {
    callback: () => void;
    event: MinifiedEvent
}
function EventCard(props: EventCardProps) {
    return (
        <InformationCard
            callback={props.callback}
        >
            <div className={styles.main}>
                <DefaultTypography fontSize={"larger"}>{props.event.title} (#{props.event.id})</DefaultTypography>
                <DefaultTypography color={"gray"}>{moment.unix(props.event.start).format("DD/MM/YYYY @ HH:mm:ss")} {">"} {moment.unix(props.event.end).format("DD/MM/YYYY @ HH:mm:ss")}</DefaultTypography>
            </div>
        </InformationCard>
    );
}

export default EventCard;