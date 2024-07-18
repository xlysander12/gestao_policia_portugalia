import style from './loader.module.css';

type LoaderProps = {
    size?: string;
    color?: string;
}

const Loader = ({ size = '120px', color = '#049985' }: LoaderProps): JSX.Element  => {
    return (
        <div className={style.loader} style={{ width: size, height: size, borderTopColor: color }}></div>
    );
}

export default Loader;