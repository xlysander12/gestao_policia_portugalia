import style from './loader.module.css';

type LoaderProps = {
    size?: string;
    color?: string;
}

function Loader({size, color}: LoaderProps) {
    size = size || '120px';
    color = color || '#049985';

    return (
            <div className={style.loader} style={{width: size, height: size, borderTopColor: color}}></div>
    )
}

export default Loader;