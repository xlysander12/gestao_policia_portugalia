import {DefaultTypography} from "./index.ts";
import {Link} from "react-router-dom";
import {DefaultTypographyProps} from "./DefaultTypography.tsx";

type DefaultLinkProps = DefaultTypographyProps & {
    to: string
    disableClickable?: boolean
}
function DefaultLink(props: DefaultLinkProps) {
    return (
        <Link
            to={props.to}
            style={{textDecoration: "none"}}
        >
            <DefaultTypography
                clickable={!props.disableClickable}
                {...props}
            >
                {props.children}
            </DefaultTypography>
        </Link>

    );
}

export default DefaultLink;