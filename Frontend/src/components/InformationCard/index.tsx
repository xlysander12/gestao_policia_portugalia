import {ReactNode} from "react";
import style from "./index.module.css"

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
        <div
            className={disabled ? style.informationCardMainDisabled: style.informationCardMain}
            style={{
                borderColor: statusColor ?? "",
                backgroundColor: selected ? "var(--portalseguranca-color-hover-dark)" : ""
            }}
            onClick={callback}
        >
            {children}
        </div>
    )
}

export default InformationCard;