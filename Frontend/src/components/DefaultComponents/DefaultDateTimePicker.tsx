import {DateTimePicker, DateTimePickerProps} from "@mui/x-date-pickers";
import { Moment } from "moment";
import {styled} from "@mui/system";
import {DefaultTextField} from "./index.ts";
import {DefaultPickersLayout} from "./DefaultDateCalendar.tsx";

type DefaultDateTimePickerProps = DateTimePickerProps<Moment, any> & { textWhenDisabled?: boolean };

const DefaultDateTimePickerStyle = styled(DateTimePicker, {
    shouldForwardProp: (prop) => prop !== "textWhenDisabled"
})<DefaultDateTimePickerProps>(({textWhenDisabled}) => ({
    "& .MuiIconButton-root": {
        margin: 0,
        color: "var(--portalseguranca-color-accent)",

        "&.Mui-disabled": {
            display: textWhenDisabled ? "none" : "block",
            color: "rgba(0, 0, 0, 0.26)"
        }
    }
}));

const DefaultDateTimePicker = (props: DefaultDateTimePickerProps) => {
    return (
      <DefaultDateTimePickerStyle
          {...props}
          slots={{
              ...props.slots,
              textField: DefaultTextField,
              layout: DefaultPickersLayout
          }}
      />
    );
}

export default DefaultDateTimePicker;