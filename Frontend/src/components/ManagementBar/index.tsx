import {ReactNode} from "react";
import style from "./index.module.css";

function ManagementBar({children}: {children: ReactNode | ReactNode[]}) {
    return (
        <div className={style.mainDiv}>
            {children}
        </div>
    );

}

export default ManagementBar;