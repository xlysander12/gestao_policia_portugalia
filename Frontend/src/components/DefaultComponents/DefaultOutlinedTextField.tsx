import {styled} from "@mui/material/styles";
import {IconButton, InputAdornment, OutlinedTextFieldProps, TextField} from "@mui/material";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";

type DefaultOutlinedTextFieldProps = Partial<OutlinedTextFieldProps> & {alternateColor?: boolean, textWhenDisabled?: boolean};

const DefaultOutlinedTextFieldStyle = styled(TextField, {
    shouldForwardProp: (prop) => prop !== "alternateColor" && prop !== "textWhenDisabled"
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
    const [showPassword, setShowPassword] = useState<boolean>(props.type !== "password");

    return (
        <DefaultOutlinedTextFieldStyle
            variant={"outlined"}
            {...props}
            type={showPassword ? "text" : "password"}
            InputProps={{
                ...props.InputProps,
                endAdornment: props.type === "password" ? (
                    <InputAdornment position={"end"}>
                        <IconButton
                            onClick={() => {setShowPassword((prev) => !prev)}}
                            edge={"end"}
                        >
                            {showPassword ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                        </IconButton>
                    </InputAdornment>
                ) : props.InputProps?.endAdornment,
            }}
        />
    );
}

export default DefaultOutlinedTextField;