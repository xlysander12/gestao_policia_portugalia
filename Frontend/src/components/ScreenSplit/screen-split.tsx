import styles from './screen-split.module.css';
import {ReactElement} from "react";

type ScreenSplitProps = {
    leftSideComponent: ReactElement | ReactElement[];
    leftSidePercentage: number | "fit-content";
    children: ReactElement | ReactElement[];
}

const ScreenSplit = ({leftSideComponent, leftSidePercentage, children}: ScreenSplitProps): ReactElement => {

    const leftSideWidth = !isNaN(Number(leftSidePercentage)) ? `${leftSidePercentage}%` : "fit-content";

    return (
        <div className={styles.mainDiv}>
            <div className={styles.leftDiv} style={{width: leftSideWidth}}>
                {leftSideComponent}
            </div>

            <div className={styles.rightDiv} style={{width: !isNaN(Number(leftSidePercentage)) ? `${100 - (leftSidePercentage as number)}%` : "fit-content"}}>
                {children}
            </div>
        </div>
    );
}

export default ScreenSplit;