import {Bounce, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function DefaultToastContainer() {
    return (
        <ToastContainer
            position={"top-right"}
            autoClose={5000}
            hideProgressBar={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            pauseOnHover
            theme={"dark"}
            transition={Bounce}
        />
    );
}

export default DefaultToastContainer;