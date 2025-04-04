import {IconButton, InputAdornment, StandardTextFieldProps, TextField} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {styled} from "@mui/material/styles";
import { useState } from "react";

type DefaultTextFieldProps = Partial<StandardTextFieldProps> & {textWhenDisabled?: boolean}

const DefaultTextFieldStyle = styled(TextField, {
    shouldForwardProp: (prop) => prop !== "textWhenDisabled"
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
    const [showPassword, setShowPassword] = useState<boolean>(props.type !== "password");

    return (
        <DefaultTextFieldStyle
            variant={"standard"}
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
                            {showPassword ? <VisibilityOffIcon sx={{color: "white"}}/> : <VisibilityIcon sx={{color: "white"}}/>}
                        </IconButton>
                    </InputAdornment>
                ) : undefined,
            }}
        />
    );
}

export default DefaultTextField;