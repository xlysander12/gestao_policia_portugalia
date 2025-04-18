import FullCalendar from "@fullcalendar/react";
import momentPlugin from "@fullcalendar/moment"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from "@fullcalendar/timegrid"
import ptLocale from "@fullcalendar/core/locales/pt"
import moment from "moment";

function ForceCalendar() {
    return (
        <FullCalendar
            plugins={[momentPlugin, dayGridPlugin, interactionPlugin, timeGridPlugin]}
            height={"100%"}
            locale={ptLocale}
            titleFormat={"MMMM [de] YYYY"}
            firstDay={0}
            nowIndicator
            initialView={"dayGridMonth"}
            headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,dayGridWeek,timeGridDay"
            }}
            dateClick={(e) => {
                console.log(e.date);
            }}
            eventClick={(event) => {
                console.log(event.event);
            }}
            events={[
                {
                    title: "Teste",
                    start: moment().toDate(),
                    end: moment().add(2, "days").toDate()
                }
            ]}
        />
    );
}

export default ForceCalendar;