import {DateTimePicker, DateTimePickerProps} from "@mui/x-date-pickers";
import { Moment } from "moment";
import {styled} from "@mui/system";
import {DefaultTextField} from "./index.ts";
import {DefaultPickersLayout} from "./DefaultDateCalendar.tsx";
import moment from "moment/moment";

type DefaultDateTimePickerProps = DateTimePickerProps<Moment, any> & {
    textWhenDisabled?: boolean
    clearable?: boolean
};

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
                  clearable: props.clearable,
                  ...props.slotProps?.field,
              }
          }}
      />
    );
}

export default DefaultDateTimePicker;