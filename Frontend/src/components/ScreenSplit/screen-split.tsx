import styles from './screen-split.module.css';
import {ReactElement} from "react";

type ScreenSplitProps = {
    leftSideComponent: ReactElement | ReactElement[];
    leftSidePercentage: number;
    children: ReactElement | ReactElement[];
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