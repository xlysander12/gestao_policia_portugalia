import { useState } from 'react'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Navbar from "./components/Navbar/navbar.tsx";
import {base_url} from "./utils/constants.ts";
import Dashboard from "./pages/Dashboard/dashboard.tsx";
import {Bounce, ToastContainer} from "react-toastify";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter basename={base_url}>
          <Navbar />
          <div style={{height: "cacl(100vh - calc(4rem + 16px))"}}>
              <Routes>
                  {/*Login route, doesn't need the PrivateRoute Component*/}
                  <Route path={"/login"} element={null} />

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
