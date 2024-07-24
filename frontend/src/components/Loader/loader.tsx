import {ReactElement} from "react";
import {CircularProgress} from "@mui/material";

type LoaderProps = {
    size?: string;
    color?: string;
}

const Loader = ({ size = '120px', color = '#049985' }: LoaderProps): ReactElement  => {
    return (
        <CircularProgress
            size={size}
            sx={{color: color}}
        />
    );
}

export default Loader;