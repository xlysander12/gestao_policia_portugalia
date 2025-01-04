import {useContext, useEffect, useState} from 'react'
import './App.css'
import "react-toastify/dist/ReactToastify.css";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {BASE_URL} from "./utils/constants.ts";
import Dashboard from "./pages/Dashboard/dashboard.tsx";
import {Bounce, ToastContainer} from "react-toastify";
import Login from "./pages/Login/login.tsx";
import PrivateRoute from "./components/PrivateRoute/private-route.tsx";
import OfficerInfo from "./pages/OfficerInfo/officerinfo.tsx";
import {ForceDataContext, ForceDataContextType} from "./force-data-context.ts";
import {make_request} from "./utils/requests.ts";
import {
    UtilInactivityTypesResponse,
    UtilIntentsResponse,
    UtilPatentsResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/util/output";
import Loader from "./components/Loader/loader.tsx";
import {createTheme, ThemeProvider} from "@mui/material";
import defaultThemeData from "./theme.ts";
import Activity from "./pages/Activity";

function App() {
    const [canLoad, setCanLoad] = useState<boolean>(false);
    const [force, setForce] = useState<string>(localStorage.getItem("force") || "");
    const [forceData, setForceData] = useState<ForceDataContextType>(useContext(ForceDataContext));

    const handleForceChange = (newForce: string) => {
        localStorage.setItem("force", newForce);
        setForce(newForce);
    }

    useEffect(() => {
        async function fetchForceData() {
            // Creating a local variable to store the force data
            let forceTempData: ForceDataContextType = {
                patents: [],
                statuses: [],
                intents: [],
                inactivity_types: [],
                special_units: [],
                special_unit_roles: []
            }

            // Fetching the patents
            const patentsResponse = await make_request("/util/patents", "GET");
            forceTempData.patents = ((await patentsResponse.json()) as UtilPatentsResponse).data;

            // Fetching the statuses
            const statusesResponse = await make_request("/util/statuses", "GET");
            forceTempData.statuses = ((await statusesResponse.json()) as UtilStatusesResponse).data;

            // Fetching the intents
            const intentsResponse = await make_request("/util/intents", "GET");
            forceTempData.intents = ((await intentsResponse.json()) as UtilIntentsResponse).data;

            // Fetching the inactivity types
            const inactivityTypesResponse = await make_request("/util/inactivity-types", "GET");
            forceTempData.inactivity_types = ((await inactivityTypesResponse.json()) as UtilInactivityTypesResponse).data;

            // Fetching the special units
            const specialUnitsResponse = await make_request("/util/special-units", "GET");
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
            fetchForceData();
        } else {
            setCanLoad(true);
        }
    }, [force]);

    const router = createBrowserRouter(
        [
            {
                path: "/login",
                element: <PrivateRoute element={<Login/>} handleForceChange={handleForceChange} isLoginPage/>
            },
            {
                path: "/",
                element: <PrivateRoute handleForceChange={handleForceChange} element={<Dashboard/>}/>
            },
            {
                path: "/efetivos",
                children: [
                    {
                        path: "",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<OfficerInfo/>}/>
                    },
                    {
                        path: ":nif",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<OfficerInfo/>}/>
                    }
                ]
            },
            {
                path: "/atividade",
                children: [
                    {
                        path: "",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<Activity/>}/>
                    },
                    {
                        path: ":nif",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<Activity/>}/>
                    }
                ]
            }
        ], {
            basename: BASE_URL
        })


    const defaultTheme = createTheme(defaultThemeData);
    if (!canLoad) {
        return (
            <Loader fullPage/>
        )
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <ForceDataContext.Provider value={forceData}>
                <RouterProvider router={router} />
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
        </ThemeProvider>
      )
}

export default App
