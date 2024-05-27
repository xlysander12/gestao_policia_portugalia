import React, {Component, StrictMode} from "react";
import {Route, Routes, BrowserRouter} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login/login";
import Dashboard from "./pages/Dashboard/dashboard";
import OfficerInfo from "./pages/OfficerInfo/officerinfo";
import PrivateRoute from "./components/PrivateRoute";

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