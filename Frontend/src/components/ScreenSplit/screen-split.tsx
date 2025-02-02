import styles from './screen-split.module.css';
import {ReactElement} from "react";
import Loader from "../Loader/loader.tsx";

type ScreenSplitProps = {
    leftSideComponent: ReactElement | ReactElement[];
    leftSidePercentage: number;
    children: ReactElement | ReactElement[];
}

export const LoadingHalfScreen = () => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
            }}
        >
            <Loader />
        </div>
    )
}

const ScreenSplit = ({leftSideComponent, leftSidePercentage, children}: ScreenSplitProps): ReactElement => {
    return (
        <div className={styles.mainDiv}>
            <div className={styles.leftDiv} style={{width: `${leftSidePercentage}%`}}>
                {leftSideComponent}
            </div>

            <div className={styles.rightDiv} style={{width: `${100 - leftSidePercentage}%`}}>
                {children}
            </div>
        </div>
    );
}

export default ScreenSplit;