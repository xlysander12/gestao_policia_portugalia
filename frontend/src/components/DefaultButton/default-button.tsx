import {styled} from "@mui/material/styles";
import {Button} from "@mui/material";

// @ts-ignore
const DefaultButtonStyle = styled(Button)(({buttonColor, darkTextOnHover}) => ({
    "&.MuiButton-root": {
        backgroundColor: "transparent",
        color: buttonColor,
        borderColor: buttonColor,
        "&:hover": {
            backgroundColor: buttonColor,
            color: darkTextOnHover ? "black": "white"
        }
    }
}));

export const DefaultButton = (props: any) => {
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