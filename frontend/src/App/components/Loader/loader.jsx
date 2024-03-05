import style from './loader.module.css';

function Loader(props) {
    let size = props.size || '120px';
    let color = props.color || '#1f2833';

    return (
            <div className={style.loader} style={{width: size, height: size, borderTopColor: color}}></div>
    )
}

export default Loader;