import {useContext, useEffect, useState} from 'react'
import './App.css'
import "react-toastify/dist/ReactToastify.css";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {BASE_URL} from "./utils/constants.ts";
import Dashboard from "./pages/Dashboard";
import {Bounce, ToastContainer} from "react-toastify";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute.tsx";
import OfficerInfo from "./pages/OfficerInfo";
import {ForcesDataContext, ForceData} from "./forces-data-context.ts";
import {make_request} from "./utils/requests.ts";
import {
    UtilEvaluationFieldsResponse,
    UtilEvaluationGradesResponse,
    UtilForcePatrolForcesResponse,
    UtilInactivityTypesResponse,
    UtilIntentsResponse,
    UtilPatentsResponse,
    UtilPatrolTypesResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/util/output";
import {Loader} from "./components/Loader";
import {createTheme, ThemeProvider} from "@mui/material";
import defaultThemeData from "./theme.ts";
import Activity from "./pages/Activity";
import Patrols from "./pages/Patrols";
import { useImmer } from 'use-immer';
import {LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import UnexpectedError from "./pages/UnexpectedError";
import Evaluations from "./pages/Evaluations";

function App() {
    const [canLoad, setCanLoad] = useState<boolean>(false);
    const [force, setForce] = useState<string>(localStorage.getItem("force") || "");
    const [forceData, setForceData] = useImmer<ForcesDataContext>(useContext(ForcesDataContext));

    const handleForceChange = (newForce: string) => {
        setForce(newForce);
        localStorage.setItem("force", newForce);
    }

    const fetchPatrolForces = async () => {
        const response = await make_request("/util/patrol-forces", "GET");
        return (await response.json() as UtilForcePatrolForcesResponse).data;
    }

    const fetchForceData = async (forceName: string) => {
        // Creating a temp variable to store the force data
        const forceTempData: ForceData = {
            patents: [],
            statuses: [],
            intents: [],
            inactivity_types: [],
            patrol_types: [],
            evaluation_grades: [],
            evaluation_fields: [],
            special_units: [],
            special_unit_roles: []
        }

        // Fetching the patents
        const patentsResponse = await make_request("/util/patents", "GET", {force: forceName});
        forceTempData.patents = ((await patentsResponse.json()) as UtilPatentsResponse).data;

        // Fetching the statuses
        const statusesResponse = await make_request("/util/statuses", "GET", {force: forceName});
        forceTempData.statuses = ((await statusesResponse.json()) as UtilStatusesResponse).data;

        // Fetching the intents
        const intentsResponse = await make_request("/util/intents", "GET", {force: forceName});
        forceTempData.intents = ((await intentsResponse.json()) as UtilIntentsResponse).data;

        // Fetching the inactivity types
        const inactivityTypesResponse = await make_request("/util/inactivity-types", "GET", {force: forceName});
        forceTempData.inactivity_types = ((await inactivityTypesResponse.json()) as UtilInactivityTypesResponse).data;

        // Fetching the patrol types
        const patrolTypesResponse = await make_request("/util/patrol-types", "GET", {force: forceName});
        forceTempData.patrol_types = ((await patrolTypesResponse.json()) as UtilPatrolTypesResponse).data;

        // Fetching the evaluation grades
        const evaluationGradesResponse = await make_request("/util/evaluation-grades", "GET", {force: forceName});
        forceTempData.evaluation_grades = ((await evaluationGradesResponse.json()) as UtilEvaluationGradesResponse).data;

        // Fetching the evaluation fields
        const evaluationFieldsResponse = await make_request("/util/evaluation-fields", "GET", {force: forceName});
        forceTempData.evaluation_fields = ((await evaluationFieldsResponse.json()) as UtilEvaluationFieldsResponse).data;

        // Fetching the special units
        const specialUnitsResponse = await make_request("/util/special-units", "GET", {force: forceName});
        const specialUnitsJson: UtilSpecialUnitsResponse = ((await specialUnitsResponse.json()) as UtilSpecialUnitsResponse);

        // Store the special units in the temp object
        forceTempData.special_units = specialUnitsJson.data.units;

        // Store the special units roles in the temp object
        forceTempData.special_unit_roles = specialUnitsJson.data.roles;


        // Return the force's data
        return forceTempData;
    }

    const handleLogin = () => {
        setForce(localStorage.getItem("force")!);
    }

    useEffect(() => {
        async function execute() {
            // Make sure the page is loading
            setCanLoad(false);

            // Get all forces current force can patrol with
            const patrolForces = await fetchPatrolForces();

            // To the list of forces, add the current force, if not already present
            if (!patrolForces.includes(force)) {
                patrolForces.push(force);
            }

            // For each force, fetch it's data and put it on the state
            for (const forceName of patrolForces) {
                // Get the force's data
                const forceData = await fetchForceData(forceName);

                setForceData(draft => {
                    draft[forceName] = forceData;
                });
            }

            // After fetching all forces' data, set the canLoad to true
            setCanLoad(true);
        }

        if (localStorage.getItem("force") && (location.pathname !== `${BASE_URL}/erro`)) {
            execute();
        } else {
            setCanLoad(true);
        }
    }, [force]);

    const router = createBrowserRouter(
        [
            {
                errorElement: location.hostname !== "localhost" ? <UnexpectedError /> : undefined,
                children: [
                    {
                        path: "/login",
                        element: <PrivateRoute element={<Login onLoginCallback={handleLogin}/>} handleForceChange={handleForceChange} isLoginPage/>
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
                            },
                            {
                                path: ":nif/:type/:entry_id",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Activity/>}/>
                            }
                        ]
                    },
                    {
                        path: "/patrulhas",
                        children: [
                            {
                                path: "",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Patrols/>}/>
                            },
                            {
                                path: ":patrolId",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Patrols/>}/>
                            }
                        ]
                    },
                    {
                        path: "/avaliacoes",
                        children: [
                            {
                                path: "",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations />}/>
                            },
                            {
                                path: ":nif",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations />}/>
                            },
                            {
                                path: ":nif/author",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations />}/>
                            },
                            {
                                path: ":nif/:entry_id",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations />} />
                            }
                        ]
                    },
                    {
                        path: "/erro",
                        element: <UnexpectedError/>
                    }
                ]
            }
        ], {
            basename: BASE_URL
        })


    const defaultTheme = createTheme(defaultThemeData);
    if (!canLoad || ((force !== "" && forceData[force] === undefined) && location.pathname !== `${BASE_URL}/erro`)) {
        return (
            <Loader fullPage/>
        )
    }

    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <ThemeProvider theme={defaultTheme}>
                <ForcesDataContext.Provider value={forceData}>
                    <RouterProvider router={router} />
                </ForcesDataContext.Provider>

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
        </LocalizationProvider>
      )
}

export default App
