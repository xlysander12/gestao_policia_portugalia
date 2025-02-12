import {ReactNode} from "react";
import style from "./index.module.css";

/**
 * Management bar component
 * Adds a black bar on top the children to add any kind of utility components
 *
 * The total height of this bar is 5.4rem (content + padding)
 * @param children
 * @constructor
 */
function ManagementBar({children}: {children: ReactNode | ReactNode[]}) {
    return (
        <div className={style.mainDiv}>
            {children}
        </div>
    );

}

export default ManagementBar;