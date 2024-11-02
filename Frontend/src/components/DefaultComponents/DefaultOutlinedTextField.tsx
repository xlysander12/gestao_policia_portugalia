import {styled} from "@mui/material/styles";
import {OutlinedTextFieldProps, TextField} from "@mui/material";

type DefaultOutlinedTextFieldProps = Partial<OutlinedTextFieldProps> & {alternateColor?: boolean};

const DefaultOutlinedTextFieldStyle = styled(TextField, {
    shouldForwardProp: (prop) => prop !== "alternateColor"
})<DefaultOutlinedTextFieldProps>(({alternateColor}) => ({
    "& label.Mui-focused": {
        color: "white !important",
        textShadow: "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black"
    },

    "& label.MuiInputLabel-shrink": {
        color: alternateColor ? "var(--portalseguranca-color-text-light)": "black",
        textShadow: alternateColor ? "-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black": "none"
    },

    "& .MuiOutlinedInput-root": {
        backgroundColor: `${alternateColor ? "var(--portalseguranca-color-background-light)": "transparent"}`,
        color: `${alternateColor ? "black": "white"}`,

        "&.Mui-focused fieldset": {
            borderColor: "var(--portalseguranca-color-focus)",
        }
    }
}));
const DefaultOutlinedTextField = (props: DefaultOutlinedTextFieldProps) => {
    return (
        <DefaultOutlinedTextFieldStyle
            variant={"outlined"}
            {...props}
        />
    );
}

export default DefaultOutlinedTextField;