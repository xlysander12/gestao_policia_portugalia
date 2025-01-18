import {styled} from "@mui/material/styles";
import {OutlinedTextFieldProps, TextField} from "@mui/material";

type DefaultOutlinedTextFieldProps = Partial<OutlinedTextFieldProps> & {alternateColor?: boolean, textWhenDisabled?: boolean};

const DefaultOutlinedTextFieldStyle = styled(TextField, {
    shouldForwardProp: (prop) => prop !== "alternateColor" && prop !== "sameBehaviourWhenDisabled"
})<DefaultOutlinedTextFieldProps>(({alternateColor, textWhenDisabled}) => ({
    "& label": {
        color: alternateColor ? "rgba(0, 0, 0, 0.6)": "var(--portalseguranca-color-text-light)",
    },

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

        "& fieldset": {
            borderColor: `${alternateColor ? "var(--portalseguranca-color-text-light)": "var(--portalseguranca-color-accent)"}`,
        },

        "&.Mui-focused fieldset": {
            borderColor: "var(--portalseguranca-color-focus)",
        },

        "&.Mui-disabled": {
            "& fieldset": {
                borderColor: `${textWhenDisabled ? "transparent": "var(--portalseguranca-color-accent)"}`,
            },

            padding: `${textWhenDisabled ? "4px 0 5px": "16.5px, 14px"}`,
        },

        "& .MuiOutlinedInput-input": {
            "&.Mui-disabled": {
                WebkitTextFillColor: `${textWhenDisabled ? "var(--portalseguranca-color-text-light)": "rgba(208,199,211,0.5)"}`,
            }
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