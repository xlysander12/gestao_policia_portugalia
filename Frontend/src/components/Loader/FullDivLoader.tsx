import Loader from "./Loader.tsx";
type FullDivLoaderProps = {
    size?: string
}

const FullDivLoader = (props: FullDivLoaderProps) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                width: "100%"
            }}
        >
            <Loader {...props}/>
        </div>
    )
}

export default FullDivLoader;