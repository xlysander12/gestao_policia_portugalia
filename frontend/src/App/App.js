import React, {Component, StrictMode} from "react";
import {Route, Routes, BrowserRouter} from "react-router-dom";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login/login";
import Dashboard from "./pages/Dashboard/dashboard";
import OfficerInfo from "./pages/OfficerInfo/officerinfo";
import PrivateRoute from "./components/private-route";
import {Bounce, ToastContainer} from "react-toastify";
import Navbar from "./components/Navbar/navbar";
import {base_url} from "./utils/constants";

class App extends Component {
    render() {
        const App = () => (
            <div>
                <BrowserRouter basename={base_url}>
                    <Navbar/>
                    <div style={{height: "calc(100vh - calc(4rem + 16px))"}}>
                        <Routes>
                            <Route path="/login" element={<Login/>}/>

                            <Route exact path="/" element={<PrivateRoute element={Dashboard} />} />
                            <Route path="/efetivos" element={<PrivateRoute element={OfficerInfo} />} />
                        </Routes>
                    </div>
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