import { useState } from 'react'
import './App.css'
import "react-toastify/dist/ReactToastify.css";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Navbar from "./components/Navbar/navbar.tsx";
import {BASE_URL} from "./utils/constants.ts";
import Dashboard from "./pages/Dashboard/dashboard.tsx";
import {Bounce, ToastContainer} from "react-toastify";
import Login from "./pages/Login/login.tsx";
import PrivateRoute from "./components/PrivateRoute/private-route.tsx";
import OfficerInfo from "./pages/OfficerInfo/officerinfo.tsx";

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <BrowserRouter basename={BASE_URL}>
              <Navbar />

              <div style={{height: "cacl(100vh - calc(4rem + 16px))"}}>
                  <Routes>
                      {/*Login route, doesn't need the PrivateRoute Component*/}
                      <Route path={"/login"} element={<Login />} />

                  {/*Routes that require the user to be logged in*/}
                  <Route path={"/"} element={<Dashboard />} />
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
        </>
      )
}

export default App
