import {styled} from "@mui/material/styles";
import {Button, ButtonProps, InputProps, Select, SelectProps, TextField, TextFieldProps} from "@mui/material";

// @ts-ignore
const DefaultButtonStyle = styled(Button)(({buttonColor, darkTextOnHover}) => ({
    "&.MuiButton-root": {
        backgroundColor: "transparent",
        color: buttonColor,
        borderColor: buttonColor,
        "&:hover": {
            backgroundColor: buttonColor || "var(--portalseguranca-color-accent)",
            color: darkTextOnHover ? "black": "white"
        }
    }
}));
export const DefaultButton = (props: Partial<ButtonProps> & {buttonColor?: string, darkTextOnHover?: boolean}) => {
    return (
        <DefaultButtonStyle
            variant={"outlined"}
            disableRipple
            {...props}
        >
            {props.children}
        </DefaultButtonStyle>
    );
};

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
            WebkitTextFillColor: `${sameTextColorWhenDisabled ? "var(--portalseguranca-color-text-light)": "#d0c7d380"} !important`,
        },

        "&.Mui-error": {
            borderBottomColor: "red"
        }
    },

    "& .MuiInputBase-root": {
        caretColor: "white",

        "&:before": {
            borderBottom: "3px solid #049985"
        },

        "&:hover:not(.Mui-disabled, .Mui-error):before": {
            borderBottom: "3px solid #049985"
        },

        "& .Mui-error:before": {
            borderBottomColor: "red"
        },

        "&.Mui-disabled:before": {
            border: 0
        },

        "&:after": {
            borderBottom: "3px solid #00fdfd"
        },
    }
}));
export const DefaultTextField = (props: Partial<TextFieldProps> & {sameTextColorWhenDisabled?: boolean}) => {
    return (
        <DefaultTextFieldStyle
            variant={"standard"}
            {...props}
        />
    );
}

// @ts-ignore
const DefaultOutlinedTextFieldStyle = styled(TextField)(({alternateColor}) => ({
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
export const DefaultOutlinedTextField = (props: Partial<TextFieldProps> & Partial<InputProps> & {alternateColor?: boolean}) => {
    return (
        <DefaultOutlinedTextFieldStyle
            variant={"outlined"}
            {...props}
        />
    );
}

// @ts-ignore
const DefaultSelectStyle = styled(Select)(({sameTextColorWhenDisabled}) => ({
    "& .MuiSelect-icon": {
        color: "var(--portalseguranca-color-accent)",

        "&.Mui-disabled": {
            display: "none",
        },
    },

    "& .MuiInput-input": {
        fontWeight: 500,
        WebkitTextFillColor: `${sameTextColorWhenDisabled ? "var(--portalseguranca-color-text-light)": "#d0c7d380"} !important`,

        "&.Mui-disabled": {
            WebkitTextFillColor: "var(--portalseguranca-color-text-light)",
            WebkitUserSelect: "auto",
            userSelect: "auto"
        }
    }
}));
const DefaultSelectSlotProps = {
    root: {
        sx: {
            "label+&": {
                margin: 0
            },

            "&:before": {
                borderBottom: "3px solid #049985"
            },

            "&:hover:not(.Mui-disabled, .Mui.error):before": {
                borderBottom: "3px solid #049985"
            },

            "&.Mui-disabled:before": {
                border: 0
            },

            "&:after": {
                borderBottom: "3px solid #00fdfd"
            },
        }
    }
}
export const DefaultSelect = (props: Partial<SelectProps> & {sameTextColorWhenDisabled?: boolean}) => {
    return (
        <DefaultSelectStyle
            variant={"standard"}
            slotProps={DefaultSelectSlotProps}
            {...props}
        >
            {props.children}
        </DefaultSelectStyle>
    );
}