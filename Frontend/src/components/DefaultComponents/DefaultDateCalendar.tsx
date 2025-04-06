import {DateCalendar, DateCalendarProps, PickersLayoutProps, PickersLayoutRoot} from "@mui/x-date-pickers";
import {styled} from "@mui/system";
import {Moment} from "moment";

const styles = {
    "& .MuiDayCalendar-weekDayLabel": {
        color: "var(--portalseguranca-color-accent)"
    },

    "& .MuiPickersCalendarHeader-switchViewIcon": {
        fill: "var(--portalseguranca-color-accent)"
    },

    "& .MuiSvgIcon-root": {
        fill: "var(--portalseguranca-color-accent)"
    },

    "& .MuiPickersCalendarHeader-label": {
        textTransform: "capitalize"
    }
}

export const DefaultPickersLayoutStyle = styled(PickersLayoutRoot)(styles);

export const DefaultPickersLayout = (props: PickersLayoutProps<any, any, any>) => {
    return (
        <DefaultPickersLayoutStyle
            ownerState={props}
            {...props}
        >
            {props.children}
        </DefaultPickersLayoutStyle>
    )
}

type DefaultDateCalendarProps = DateCalendarProps<Moment>;

const DefaultDateCalendarStyle = styled(DateCalendar, {
    shouldForwardProp: (_prop) => true
})<DefaultDateCalendarProps>(() => (styles));

const DefaultDateCalendar = (props: DefaultDateCalendarProps) => {
    return (
        <DefaultDateCalendarStyle
            {...props}
        />
    )
}

export default DefaultDateCalendar;