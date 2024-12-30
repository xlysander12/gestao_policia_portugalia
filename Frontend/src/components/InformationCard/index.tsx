import {ReactNode} from "react";
import style from "./index.module.css"

type InformationCardProps = {
    statusColor?: string,
    callback: (any: any) => void,
    disabled?: boolean,
    children: ReactNode | ReactNode[]
}
function InformationCard({statusColor, callback, disabled, children}: InformationCardProps) {
    return (
        <div
            className={disabled ? style.informationCardMainDisabled: style.informationCardMain}
            style={statusColor ? {borderColor: `${statusColor}`}: {}}
            onClick={callback}
        >
            {children}
        </div>
    )
}

export default InformationCard;