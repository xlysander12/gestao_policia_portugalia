import {Button, ButtonProps} from "@mui/material";
import { styled } from "@mui/system";

type DefaultButtonProps = Partial<ButtonProps> & {buttonColor?: string, darkTextOnHover?: boolean};

const DefaultButtonStyle = styled(Button, {
    shouldForwardProp: (prop) => prop !== "buttonColor" && prop !== "darkTextOnHover"
})<DefaultButtonProps>(({buttonColor, darkTextOnHover}) => ({
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

const DefaultButton = (props: DefaultButtonProps) => {
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