import FullCalendar from "@fullcalendar/react";
import momentPlugin from "@fullcalendar/moment"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from "@fullcalendar/timegrid"
import ptLocale from "@fullcalendar/core/locales/pt"
import moment, {Moment} from "moment";
import {useCallback, useEffect, useState} from "react";

import {EventsListResponse, MinifiedEvent} from "@portalseguranca/api-types/events/output";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import EventModal from "./EventModal.tsx";
import {useWebSocketEvent} from "../../../../hooks";
import {SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types";
import {useParams} from "react-router-dom";

type InnerMinifiedEvent = Omit<MinifiedEvent, "id" | "start" | "end"> & {
    id: string
    start: Date
    end: Date
}

function ForceCalendar() {
    // Get the event_id from URL params
    const {event_id} = useParams();

    const [loading, setLoading] = useState<boolean>(true);

    const [currentMonth, setCurrentMonth] = useState<number>(moment().month() + 1);
    const [events, setEvents] = useState<InnerMinifiedEvent[]>([]);

    // Modal related state
    const [selectedEventID, setSelectedEventID] = useState<string>();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isNewEntry, setIsNewEntry] = useState<boolean>(false);
    const [newEntryMoment, setNewEntryMoment] = useState<Moment>(moment());

    async function fetchEvents(showLoading = true) {
        if (showLoading) setLoading(true);

        // Fetch the events list from the backend
        const response = await make_request(`/events?month=${currentMonth}`, RequestMethod.GET);
        const responseJson = await response.json() as EventsListResponse;

        if (!response.ok) {
            console.error(responseJson.message);
            setLoading(false);
            return;
        }

        // Apply the events to the state
        setEvents(responseJson.data.map(event => ({
            ...event,
            id: `${event.force}${event.id}`,
            start: moment.unix(event.start).toDate(),
            end: moment.unix(event.end).toDate()
        })));
    }

    // Listen for websocket events
    useWebSocketEvent<SocketResponse>(SOCKET_EVENT.EVENTS, useCallback(() => void fetchEvents(), [localStorage.getItem("force"), currentMonth]));

    useEffect(() => {
        void fetchEvents();
    }, [currentMonth]);

    // Whenever the "event_id" param changes, open the Event Modal and display the Event's information
    useEffect(() => {
        if (event_id) {
            setSelectedEventID(event_id);
            setIsNewEntry(false);
            setIsModalOpen(true);
        }

        return () => {
            setSelectedEventID(undefined);
            setIsModalOpen(false);
        }
    }, [event_id]);

    return (
        <>
            <FullCalendar
                plugins={[momentPlugin, dayGridPlugin, interactionPlugin, timeGridPlugin]}
                height={"100%"}
                locale={ptLocale}
                titleFormat={"MMMM, YYYY"}
                firstDay={0}
                nowIndicator
                initialView={"dayGridMonth"}
                allDaySlot={false}
                showNonCurrentDates={false}
                fixedWeekCount={false}
                headerToolbar={{
                    left: "prev,next",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay"
                }}
                datesSet={dates => setCurrentMonth(dates.start.getMonth() + 1)}
                eventDisplay={"block"}
                dayMaxEventRows={2}
                eventContent={(arg) => {
                    return (
                        <div style={{fontSize: "0.8rem", lineHeight: "1.2"}}>
                            <div style={{fontWeight: "bold"}}>
                                {moment(arg.event.start).format("HH:mm")} ({arg.event.id.split(/(?<=\D)(?=\d)/)[0].toUpperCase()})
                            </div>
                            <div style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                                {arg.event.title}
                            </div>
                        </div>
                    );
                }}
                dateClick={(e) => {
                    // When a date is clicked, create a new Event for said date
                    setNewEntryMoment(moment(e.date));
                    setIsNewEntry(true);
                    setIsModalOpen(true);
                }}
                eventClick={(e) => {
                    // When an Event is clicked, open the modal to show the details of the Event
                    setSelectedEventID(e.event.id);
                    setIsModalOpen(true);
                }}
                events={events}
            />

            <EventModal
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsNewEntry(false);
                }}
                id={selectedEventID ?? ""}
                newEntry={isNewEntry}
                newEntryMoment={newEntryMoment}
            />
        </>
    );
}

export default ForceCalendar;