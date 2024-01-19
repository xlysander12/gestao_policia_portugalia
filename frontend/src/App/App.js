import React, { Component } from "react";
import {Route, Routes, BrowserRouter} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login/login";
import Dashboard from "./pages/Dashboard/dashboard";
import OfficerInfo from "./pages/OfficerInfo/officerinfo";

class App extends Component {
    render() {
        const App = () => (
            <div>
                <BrowserRouter>
                    <Routes>
                        <Route exact path="/" element={<Dashboard/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/officerinfo" element={<OfficerInfo/>}/>
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