import {Button, ButtonProps} from "@mui/material";
import styled from "styled-components";

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