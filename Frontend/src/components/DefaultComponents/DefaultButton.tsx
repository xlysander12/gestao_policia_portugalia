import {Button, ButtonProps} from "@mui/material";
import styled from "styled-components";

// @ts-ignore
const DefaultButtonStyle = styled(Button)(({buttonColor, darkTextOnHover}) => ({
    "&.MuiButton-root": {
        backgroundColor: "transparent",
        color: buttonColor || "var(--portalseguranca-color-accent)",
        borderColor: buttonColor || "var(--portalseguranca-color-accent)",

        "&:hover": {
            backgroundColor: buttonColor || "var(--portalseguranca-color-accent)",
            color: darkTextOnHover ? "black": "white"
        },

        "&.Mui-disabled": {
            color: buttonColor || "var(--portalseguranca-color-accent)",
            border: `1px solid ${buttonColor || "var(--portalseguranca-color-accent)"}`,
            opacity: 0.35
        }
    }
}));

const DefaultButton = (props: Partial<ButtonProps> & {buttonColor?: string, darkTextOnHover?: boolean}) => {
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

export default DefaultButton;