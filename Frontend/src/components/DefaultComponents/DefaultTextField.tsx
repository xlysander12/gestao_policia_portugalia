import {StandardTextFieldProps, TextField} from "@mui/material";
import {styled} from "@mui/material/styles";

type DefaultTextFieldProps = Partial<StandardTextFieldProps> & {textWhenDisabled?: boolean}

const DefaultTextFieldStyle = styled(TextField, {
    shouldForwardProp: (prop) => prop !== "sameTextColorWhenDisabled"
})<DefaultTextFieldProps>(({textWhenDisabled}) => ({
    "& .MuiInputLabel-root": {
        color: "white",

        "&.Mui-focused": {
            color: "var(--portalseguranca-color-focus)"
        }
    },

    "& .MuiInput-input": {
        WebkitTextFillColor: "var(--portalseguranca-color-text-light)",
        fontWeight: 500,

        "&.Mui-disabled": {
            WebkitTextFillColor: `${textWhenDisabled ? "var(--portalseguranca-color-text-light)": "var(--portalseguranca-color-text-light)"} !important`,
        },


    },

    "& .MuiInputBase-root": {
        caretColor: "white",

        "&:before": {
            borderBottom: "3px solid var(--portalseguranca-color-accent)"
        },

        "&:hover:not(.Mui-disabled, .Mui-error):before": {
            borderBottom: "3px solid var(--portalseguranca-color-accent)"
        },

        "&.Mui-error:before": {
            borderBottomColor: "red !important"
        },

        "&.Mui-disabled:before": {
            border: 0
        },

        "&:after": {
            borderBottom: "3px solid var(--portalseguranca-color-focus)"
        },
    }
}));
const DefaultTextField = (props: DefaultTextFieldProps) => {
    return (
        <DefaultTextFieldStyle
            variant={"standard"}
            {...props}
        />
    );
}

export default DefaultTextField;