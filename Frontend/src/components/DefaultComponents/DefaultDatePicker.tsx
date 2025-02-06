import {DatePicker, DatePickerProps} from "@mui/x-date-pickers";
import {styled} from "@mui/material/styles";
import {DefaultDateCalendar, DefaultTextField} from "./index.ts";
import {Moment} from "moment";

type DefaultDatePickerProps = Partial<DatePickerProps<Moment, any>> & { textWhenDisabled?: boolean };

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
                textField: DefaultTextField,
                // @ts-ignore
                layout: DefaultDateCalendar
            }}
        />
    );
}

export default DefaultDatePicker;