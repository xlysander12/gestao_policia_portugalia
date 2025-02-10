import {DatePicker, DatePickerProps} from "@mui/x-date-pickers";
import {styled} from "@mui/material/styles";
import {DefaultTextField} from "./index.ts";
import {Moment} from "moment";
import {DefaultPickersLayout} from "./DefaultDateCalendar.tsx";

type DefaultDatePickerProps = DatePickerProps<Moment, any> & { textWhenDisabled?: boolean };

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
            {...props}
            slots={{
                ...props.slots,
                textField: DefaultTextField,
                layout: DefaultPickersLayout
            }}
        />
    );
}

export default DefaultDatePicker;