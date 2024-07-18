import style from './loader.module.css';
import {ReactElement} from "react";

type LoaderProps = {
    size?: string;
    color?: string;
}

const Loader = ({ size = '120px', color = '#049985' }: LoaderProps): ReactElement  => {
    return (
        <div className={style.loader} style={{ width: size, height: size, borderTopColor: color }}></div>
    );
}

export default Loader;