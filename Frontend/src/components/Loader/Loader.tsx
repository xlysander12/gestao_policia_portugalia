import {ReactElement} from "react";
import {CircularProgress} from "@mui/material";
import styles from "./loader.module.css";

type LoaderProps = {
    size?: string
    color?: string
    fullDiv?: boolean
    fullPage?: boolean
}
const Loader = ({ size = '120px', color = 'var(--portalseguranca-color-accent)', fullPage = false, fullDiv = false}: LoaderProps): ReactElement  => {
    if (fullPage && fullDiv) {
        throw Error("Full page and full div props can not be true at the same time");
    }


    if (fullPage || fullDiv) {
        return (
            <div className={fullPage ? styles.fullPageLoader: styles.fullDivLoader}>
                <CircularProgress
                    size={size}
                    sx={{color: color}}
                />
            </div>
        );
    }


    return (
        <CircularProgress
            size={size}
            sx={{color: color}}
        />
    );
}

export default Loader;