import React, {Component, StrictMode} from "react";
import {Route, Routes, BrowserRouter} from "react-router-dom";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login/login";
import Dashboard from "./pages/Dashboard/dashboard";
import OfficerInfo from "./pages/OfficerInfo/officerinfo";
import PrivateRoute from "./components/PrivateRoute";
import {Bounce, ToastContainer} from "react-toastify";

class App extends Component {
    render() {
        const App = () => (
            <div>
                <BrowserRouter basename={"/portugalia/portalseguranca"}>
                    <Routes>
                        <Route path="/login" element={<Login/>}/>

                        <Route exact path="/" element={<PrivateRoute element={Dashboard} />} />
                        <Route path="/efetivos" element={<PrivateRoute element={OfficerInfo} />} />
                    </Routes>
                </BrowserRouter>

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
            </div>
        );

        return (
            <StrictMode>
                <App/>
            </StrictMode>
        );
    }
}

export default App;