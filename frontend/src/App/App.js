import React, { Component } from "react";
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
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login/>}/>

                        <Route exact path="/" element={<PrivateRoute element={Dashboard} />} />
                        <Route path="/efetivos" element={<PrivateRoute element={OfficerInfo} />} />
                    </Routes>
                </BrowserRouter>
            </div>
        );

        return (
            <App/>
        );
    }
}

export default App;