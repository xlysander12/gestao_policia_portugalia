// @ts-ignore
import {StandardTextFieldProps, TextField} from "@mui/material";
import styled from "styled-components";

// @ts-ignore
const DefaultTextFieldStyle = styled(TextField)(({sameTextColorWhenDisabled}) => ({
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
            WebkitTextFillColor: `${sameTextColorWhenDisabled ? "var(--portalseguranca-color-text-light)": "var(--portalseguranca-color-text-light)"} !important`,
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
const DefaultTextField = (props: Partial<StandardTextFieldProps> & {sameTextColorWhenDisabled?: boolean}) => {
    return (
        <DefaultTextFieldStyle
            variant={"standard"}
            {...props}
        />
    );
}

export default DefaultTextField;