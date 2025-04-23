import {DatePicker, DatePickerProps} from "@mui/x-date-pickers";
import {styled} from "@mui/material/styles";
import {DefaultTextField} from "./index.ts";
import moment, {Moment} from "moment";
import {DefaultPickersLayout} from "./DefaultDateCalendar.tsx";

type DefaultDatePickerProps = DatePickerProps<Moment, any> & {
    textWhenDisabled?: boolean
    clearable?: boolean
};

const DefaultDatePickerStyle = styled(DatePicker, {
    shouldForwardProp: (prop) => prop !== "textWhenDisabled"
})<DefaultDatePickerProps>(({textWhenDisabled}) => ({
    "& .MuiIconButton-root": {
        margin: 0,
        color: "var(--portalseguranca-color-accent)",

        "&.Mui-disabled": {
            display: textWhenDisabled ? "none" : "block",
            color: "rgba(0, 0, 0, 0.26)"
        }
    }
}));

const DefaultDatePicker = (props: DefaultDatePickerProps) => {
    return (
        <DefaultDatePickerStyle
            maxDate={moment("2037-12-31")}
            minDate={moment("2020-01-01")}
            {...props}
            slots={{
                ...props.slots,
                textField: DefaultTextField,
                layout: DefaultPickersLayout
            }}
            slotProps={{
                ...props.slotProps,
                field: {
                    clearable: props.clearable
                }
            }}
        />
    );
}

export default DefaultDatePicker;