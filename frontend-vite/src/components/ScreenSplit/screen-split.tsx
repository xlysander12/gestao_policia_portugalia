import styles from './screen-split.module.css';
import {ReactElement} from "react";

type ScreenSplitProps = {
    leftSideComponent: JSX.Element;
    leftSidePercentagem: number;
    children: JSX.Element;
}

const ScreenSplit = ({leftSideComponent, leftSidePercentagem, children}: ScreenSplitProps): ReactElement => {
    return (
        <div className={styles.mainDiv}>
            <div className={styles.leftDiv} style={{width: `${leftSidePercentagem}%`}}>
                {leftSideComponent}
            </div>

            <div className={styles.rightDiv} style={{width: `${100 - leftSidePercentagem}%`}}>
                {children}
            </div>
        </div>
    );
}

export default ScreenSplit;