import Loader from "./Loader.tsx";

const FullDivLoader = () => {
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
            <Loader />
        </div>
    )
}

export default FullDivLoader;