import {DefaultTypography} from "./index.ts";
import {Link} from "react-router-dom";
import {DefaultTypographyProps} from "./DefaultTypography.tsx";

type DefaultLinkProps = DefaultTypographyProps & {
    to: string
}
function DefaultLink(props: DefaultLinkProps) {
    return (
        <Link
            to={props.to}
            style={{textDecoration: "none"}}
        >
            <DefaultTypography
                clickable
                {...props}
            >
                {props.children}
            </DefaultTypography>
        </Link>

    );
}

export default DefaultLink;