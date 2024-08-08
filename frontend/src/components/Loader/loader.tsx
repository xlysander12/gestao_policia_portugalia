import {ReactElement} from "react";
import {CircularProgress} from "@mui/material";
import styles from "./loader.module.css";

type LoaderProps = {
    size?: string
    color?: string
    fullPage?: boolean
}

const Loader = ({ size = '120px', color = '#049985', fullPage = false }: LoaderProps): ReactElement  => {
    if (!fullPage)
        return (
            <CircularProgress
                size={size}
                sx={{color: color}}
            />
        );

    return (
        <div className={styles.fullPageLoader}>
            <CircularProgress
                size={size}
                sx={{color: color}}
            />
        </div>
    );
}

export default Loader;