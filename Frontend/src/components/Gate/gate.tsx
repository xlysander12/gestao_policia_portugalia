import {ReactNode} from "react";

/**
 * Component that will show or not the children based on the condition
 **/
type GateProps = {
    show: boolean
    children: ReactNode | ReactNode[]
}
const Gate = ({show, children}: GateProps) => {
    return show ? <>{children}</> : null;
}

export default Gate;