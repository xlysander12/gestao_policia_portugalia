import {Typography, TypographyProps} from "@mui/material";
import {styled} from "@mui/system";

type DefaultTypographyProps = Partial<TypographyProps> & {
    color?: string
    clickable?: boolean
    clickableColorHover?: string
    onClick?: () => void
}

const DefaultTypographyStyle = styled(Typography, {
    shouldForwardProp: (prop) => prop !== "clickable" && prop !== "clickableColorHover"
})<DefaultTypographyProps>(({color, clickable, clickableColorHover}) => ({
    "&:hover": {
        cursor: clickable ? "pointer !important": "normal",
        color: clickable ? `${clickableColorHover} !important`: color
    }
}));

function DefaultTypography({color = "var(--portalseguranca-color-text-light)", clickable = false, clickableColorHover = "var(--portalseguranca-color-text-hover)", onClick, ...props}: DefaultTypographyProps) {
    return (
        <DefaultTypographyStyle
            color={color}
            clickable={clickable}
            clickableColorHover={clickableColorHover}
            onClick={clickable ? onClick: undefined}
            {...props}
        >
            {props.children}
        </DefaultTypographyStyle>
    )
}

export default DefaultTypography;