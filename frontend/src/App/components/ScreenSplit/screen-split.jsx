import styles from './screen-split.module.css';

const ScreenSplit = ({leftSideComponent, leftSidePercentage, children}) => {
    return (
        <div className={styles.mainDiv}>
            <div className={styles.leftDiv} style={{width: `${leftSidePercentage}%`}}>
                {leftSideComponent}
            </div>

            <div className={styles.rightDiv} style={{width: `${100 - leftSidePercentage}%`}}>
                {children}
            </div>
        </div>
    )
}

export default ScreenSplit;