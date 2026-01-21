import {Modal} from "../Modal";
import styles from "./modal.module.css"
import ManagementBar from "../ManagementBar";
import {EventsListResponse, MinifiedEvent} from "@portalseguranca/api-types/events/output";
import {useCallback, useEffect, useState} from "react";
import Gate from "../Gate/gate.tsx";
import {Loader} from "../Loader";
import EventCard from "./EventCard.tsx";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import moment from "moment";
import {toast} from "react-toastify";
import {useWebSocketEvent} from "../../hooks";
import { SOCKET_EVENT } from "@portalseguranca/api-types";

type EventPickerModalProps = {
    open: boolean;
    onClose: () => void;
    callback: (event: MinifiedEvent) => void;
    filters?: {key: string, value: string}[]
}
function EventPickerModal(props: EventPickerModalProps) {
    const [loading, setLoading] = useState<boolean>(false);

    const [events, setEvents] = useState<MinifiedEvent[]>([]);

    async function getEvents(showLoading = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        const response = await make_request("/events", RequestMethod.GET, {
            signal,
            queryParams: [
                ...(props.filters ?? []),
                {
                    key: "start",
                    value: moment().subtract(1, "year").unix().toString()
                },
                {
                    key: "end",
                    value: moment().add(1, "year").unix().toString()
                }
            ]
        });

        if (showLoading) setLoading(false);

        const responseJson: EventsListResponse = await response.json();
        if (!response.ok) {
            toast.error(responseJson.message);
            props.onClose();
            return;
        }

        setEvents(responseJson.data);
    }

    useWebSocketEvent(SOCKET_EVENT.EVENTS, useCallback(() => {
        void getEvents(false);
    }, []));

    useEffect(() => {
        const controller = new AbortController();

        if (props.open) void getEvents(true, controller.signal);

        return () => controller.abort();
    }, [props.open]);

    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={"Escolhe um evento"}
            width={"75%"}
            height={"80vh"}
        >
            <div className={styles.main}>
                <ManagementBar>
                    <div className={styles.managementBar}>

                    </div>
                </ManagementBar>

                <Gate show={loading}>
                    <div className={styles.list}>
                        <Loader fullDiv />
                    </div>
                </Gate>

                <Gate show={!loading}>
                    <div className={styles.list}>
                        {events.map(event => (
                            <EventCard key={`event#${event.force}${event.id}`} callback={() => {props.callback(event)}} event={event} />
                        ))}
                    </div>
                </Gate>

            </div>
        </Modal>
    );
}

export default EventPickerModal;