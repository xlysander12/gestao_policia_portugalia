import {useContext, useEffect, useState} from 'react'
import './App.css'
import "react-toastify/dist/ReactToastify.css";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {BASE_URL} from "./utils/constants.ts";
import Dashboard from "./pages/Dashboard/dashboard.tsx";
import {Bounce, ToastContainer} from "react-toastify";
import Login from "./pages/Login/login.tsx";
import PrivateRoute from "./components/PrivateRoute/private-route.tsx";
import OfficerInfo from "./pages/OfficerInfo/officerinfo.tsx";
import {ForceDataContext, ForceDataContextType} from "./force-data-context.ts";
import {make_request} from "./utils/requests.ts";
import {
    UtilPatentsResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/api/util/schema";

function App() {
    const [canLoad, setCanLoad] = useState<boolean>(false);
    const [forceData, setForceData] = useState<ForceDataContextType>(useContext(ForceDataContext));

    useEffect(() => {
        async function fetchForceData() {
            // Creating a local variable to store the force data
            let forceTempData: ForceDataContextType = {
                patents: [],
                statuses: [],
                special_units: [],
                special_unit_roles: []
            }

            // Fetching the patents
            const patentsResponse = await make_request("/util/patents", "GET");

            // Store the patents in the temp object
            forceTempData.patents = ((await patentsResponse.json()) as UtilPatentsResponse).data;

            // Fetching the statuses
            const statusesResponse = await make_request("/util/statuses", "GET");

            // Store the statuses in the temp object
            forceTempData.statuses = ((await statusesResponse.json()) as UtilStatusesResponse).data;

            // Fetching the special units
            const specialUnitsResponse = await make_request("/util/specialunits", "GET");

            // Getting the json from the request
            const specialUnitsJson: UtilSpecialUnitsResponse = ((await specialUnitsResponse.json()) as UtilSpecialUnitsResponse);

            // Store the special units in the temp object
            forceTempData.special_units = specialUnitsJson.data.units;

            // Store the special units roles in the temp object
            forceTempData.special_unit_roles = specialUnitsJson.data.roles;


            // Update the state
            setForceData(forceTempData);
            setCanLoad(true);
        }

        if (localStorage.getItem("force")) {
            console.log("Fetching force data");
            fetchForceData();
        }
    }, [localStorage.getItem("force")]);

    if (!canLoad) {
        return null;
    }

    return (
        <>
            <ForceDataContext.Provider value={forceData}>
                <BrowserRouter basename={BASE_URL}>
                    <Routes>
                        {/*Login route, doesn't need the PrivateRoute Component*/}
                        <Route path={"/login"} element={<PrivateRoute element={<Login />} isLoginPage />} />

                        {/*Routes that require the user to be logged in*/}
                        <Route path={"/"} element={<PrivateRoute  element={<Dashboard />}/>} />
                        <Route path={"/efetivos"} element={<PrivateRoute  element={<OfficerInfo />}/>} />
                    </Routes>
                </BrowserRouter>
            </ForceDataContext.Provider>

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