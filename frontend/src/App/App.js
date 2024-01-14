import React, { Component } from "react";
import {Route, Routes, BrowserRouter} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login/login";

class App extends Component {
    render() {
        const App = () => (
            <div>
                <BrowserRouter>
                    <Routes>
                        {/*<Route exact path="/" element={<Home/>}/>*/}
                        <Route path="/login" element={<Login/>}/>
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