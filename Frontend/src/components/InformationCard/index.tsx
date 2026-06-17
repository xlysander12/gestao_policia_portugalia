import {ReactNode} from "react";
import style from "./index.module.css"
import {Box, Paper} from "@mui/material";

type InformationCardProps = {
    statusColor?: string
    callback: (any: any) => void
    disabled?: boolean
    selected?: boolean
    children: ReactNode | ReactNode[]
}
function InformationCard({statusColor, callback, disabled, selected, children}: InformationCardProps) {
    if (selected) disabled = true;

    return (
        <Box
            className={disabled ? style.informationCardMainDisabled: style.informationCardMain}
            sx={{
                borderColor: statusColor ?? "",
                bgcolor: selected ? "var(--portalseguranca-color-hover-dark)" : "background.paper"
            }}
            onClick={callback}
        >
            {children}
        </Box>
    )
}

export default InformationCard;