import {useState, useMemo, useEffect} from 'react'
import './App.css'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {BASE_URL} from "./utils/constants.ts";
import {Dashboard} from "./pages/Dashboard";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute.tsx";
import OfficerInfo from "./pages/OfficerInfo";
import {make_request} from "./utils/requests.ts";
import {
    UtilColorsResponse,
    UtilEvaluationDecisionsResponse,
    UtilEvaluationFieldsResponse,
    UtilEvaluationGradesResponse, UtilEventTypesResponse,
    UtilForcePatrolForcesResponse,
    UtilInactivityTypesResponse,
    UtilIntentsResponse, UtilLastCeremonyResponse, UtilLastDatesFieldsResponse, UtilPatentCategoriesResponse,
    UtilPatentsResponse,
    UtilPatrolTypesResponse,
    UtilSpecialUnitsResponse,
    UtilStatusesResponse
} from "@portalseguranca/api-types/util/output";
import {Loader} from "./components/Loader";
import Activity from "./pages/Activity";
import Patrols from "./pages/Patrols";
import { useQueries, useQuery } from '@tanstack/react-query';
import {LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import UnexpectedError from "./pages/UnexpectedError";
import Evaluations from "./pages/Evaluations";
import moment from 'moment';
import Gate from "./components/Gate/gate.tsx";
import {AuditLogs} from "./pages/Audit-Logs";
import ThemeToggler from "./components/ThemeToggler/ThemeToggler.tsx";
import {CssBaseline} from "@mui/material";
import {Bounce, ToastContainer} from "react-toastify";
import {CurrentForce} from "./contexts/current-force.ts";
import {ForceData, ForcesData} from "./contexts/forces-data.ts";

function App() {
    const [currentForce, setCurrentForce] = useState<string>(localStorage.getItem("force") || "");

    const handleForceChange = (newForce: string) => {
        setCurrentForce(newForce);
    }

    useEffect(() => {
        localStorage.setItem("force", currentForce);
    }, [currentForce]);

    const fetchPatrolForces = async () => {
        const response = await make_request("/util/patrol-forces", "GET");
        return (await response.json() as UtilForcePatrolForcesResponse).data;
    }

    const fetchForceData = async (forceName: string) => {
        // Creating a temp variable to store the force data
        const forceTempData: ForceData = {
            last_ceremony: moment(),
            colors: {base: "#ffffff", text: null},
            patents: [],
            patentCategories: [],
            statuses: [],
            intents: [],
            last_dates_fields: [],
            inactivity_types: [],
            patrol_types: [],
            evaluation_grades: [],
            evaluation_fields: [],
            evaluation_decisions: [],
            event_types: [],
            special_units: [],
            special_unit_roles: []
        }

        // Fetching the last ceremony
        async function fetchLastCeremony() {
            const lastCeremonyResponse = await make_request("/util/last-ceremony", "GET");
            forceTempData.last_ceremony = moment.unix((await lastCeremonyResponse.json() as UtilLastCeremonyResponse).data);
        }

        // Fetching the colors
        async function fetchColors() {
            const patentsResponse = await make_request("/util/colors", "GET", {force: forceName});
            forceTempData.colors = ((await patentsResponse.json()) as UtilColorsResponse).data;
        }

        // Fetching the patents
        async function fetchPatents() {
            const patentsResponse = await make_request("/util/patents", "GET", {force: forceName});
            forceTempData.patents = ((await patentsResponse.json()) as UtilPatentsResponse).data;
        }

        // Fetching the patent categories
        async function fetchPatentCategories() {
            const categoriesResponse = await make_request("/util/patent-categories", "GET", {force: forceName});
            forceTempData.patentCategories = ((await categoriesResponse.json()) as UtilPatentCategoriesResponse).data;
        }

        // Fetching the statuses
        async function fetchStatuses() {
            const statusesResponse = await make_request("/util/statuses", "GET", {force: forceName});
            forceTempData.statuses = ((await statusesResponse.json()) as UtilStatusesResponse).data;
        }

        // Fetching the intents
        async function fetchIntents() {
            const intentsResponse = await make_request("/util/intents", "GET", {force: forceName});
            forceTempData.intents = ((await intentsResponse.json()) as UtilIntentsResponse).data;
        }

        // Fetching the last dates fields
        async function fetchLastDatesFields() {
            const response = await make_request("/util/last-dates-fields", "GET", {force: forceName});
            forceTempData.last_dates_fields = ((await response.json()) as UtilLastDatesFieldsResponse).data;
        }

        // Fetching the inactivity types
        async function fetchInativityTypes() {
            const inactivityTypesResponse = await make_request("/util/inactivity-types", "GET", {force: forceName});
            forceTempData.inactivity_types = ((await inactivityTypesResponse.json()) as UtilInactivityTypesResponse).data;
        }

        // Fetching the patrol types
        async function fetchPatrolTypes() {
            const patrolTypesResponse = await make_request("/util/patrol-types", "GET", {force: forceName});
            forceTempData.patrol_types = ((await patrolTypesResponse.json()) as UtilPatrolTypesResponse).data;
        }

        // Fetching the evaluation grades
        async function fetchEvaluationGrades() {
            const evaluationGradesResponse = await make_request("/util/evaluation-grades", "GET", {force: forceName});
            forceTempData.evaluation_grades = ((await evaluationGradesResponse.json()) as UtilEvaluationGradesResponse).data;
        }

        // Fetching the evaluation fields
        async function fetchEvaluationFields() {
            const evaluationFieldsResponse = await make_request("/util/evaluation-fields", "GET", {force: forceName});
            forceTempData.evaluation_fields = ((await evaluationFieldsResponse.json()) as UtilEvaluationFieldsResponse).data;
        }

        // Fetching the evaluation decisions
        async function fetchEvaluationDecisions() {
            const evaluationDecisionsResponse = await make_request("/util/evaluation-decisions", "GET", {force: forceName});
            forceTempData.evaluation_decisions = ((await evaluationDecisionsResponse.json()) as UtilEvaluationDecisionsResponse).data;
        }

        // Fetching the event types
        async function fetchEventTypes() {
            const eventTypesResponse = await make_request("/util/event-types", "GET", {force: forceName});
            forceTempData.event_types = (await eventTypesResponse.json() as UtilEventTypesResponse).data;
        }

        // Fetching the special units
        async function fetchSpecialUnits() {
            const specialUnitsResponse = await make_request("/util/special-units", "GET", {force: forceName});
            const specialUnitsJson: UtilSpecialUnitsResponse = ((await specialUnitsResponse.json()) as UtilSpecialUnitsResponse);

            // Store the special units in the temp object
            forceTempData.special_units = specialUnitsJson.data.units;

            // Store the special units roles in the temp object
            forceTempData.special_unit_roles = specialUnitsJson.data.roles;
        }

        // Fetch all data paralely
        await Promise.all([
            fetchLastCeremony(),
            fetchColors(),
            fetchPatents(),
            fetchPatentCategories(),
            fetchStatuses(),
            fetchIntents(),
            fetchLastDatesFields(),
            fetchInativityTypes(),
            fetchPatrolTypes(),
            fetchEvaluationGrades(),
            fetchEvaluationFields(),
            fetchEvaluationDecisions(),
            fetchEventTypes(),
            fetchSpecialUnits()
        ]);

        // Return the force's data
        return forceTempData;
    }

    // Use TanStack Query to fetch patrol forces and force-specific data
    const patrolForcesQuery = useQuery({
        queryKey: ['patrolForces', currentForce],
        queryFn: fetchPatrolForces,
        enabled: localStorage.getItem("force") !== null && !(location.pathname.includes(`${BASE_URL}/erro`)),
        staleTime: Infinity
    });

    const forcesToFetch = useMemo(() => {
        const list: string[] = patrolForcesQuery.data ? [...patrolForcesQuery.data] : [];
        if (currentForce && !list.includes(currentForce)) list.push(currentForce);
        return list;
    }, [patrolForcesQuery.data, currentForce]);

    const forceQueries = useQueries({
        queries: forcesToFetch.map(force => ({
            queryKey: ['forceData', force],
            queryFn: () => fetchForceData(force),
            enabled: !(location.pathname.includes(`${BASE_URL}/erro`))
        }))
    });

    const anyLoading = patrolForcesQuery.isLoading || forceQueries.some(q => q.isLoading);
    const forceData = useMemo<ForcesData>(() => {
        const fd: ForcesData = {};

        for (let i = 0; i < forcesToFetch.length; i++) {
            const data = forceQueries[i]?.data;
            if (data) {
                fd[forcesToFetch[i]] = data;
            }
        }

        return fd;
    }, [forcesToFetch, forceQueries]);

    const router = createBrowserRouter(
        [
            {
                errorElement: location.hostname !== "localhost" ? <UnexpectedError /> : undefined,
                children: [
                    {
                        path: "/login",
                        element: <Login onLoginCallback={handleForceChange}/>
                    },
                    {
                        path: "/",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<Dashboard/>}/>
                    },
                    {
                        path: "/e/:event_id",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<Dashboard/>}/>
                    },
                    {
                        path: "/a/:announcement_id",
                        element: <PrivateRoute handleForceChange={handleForceChange} element={<Dashboard />} />
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
                                path: ":nif/autor",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations asAuthor />}/>
                            },
                            {
                                path: ":nif/:entry_id",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations />} />
                            },
                            {
                                path: ":nif/decisoes",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations showDecisionsOnOpen />}  />
                            },
                            {
                                path: ":nif/decisoes/:decision_id",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<Evaluations showDecisionsOnOpen />}  />
                            }
                        ]
                    },
                    {
                        path: "registo-auditoria",
                        children: [
                            {
                                path: "",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<AuditLogs/>}/>
                            },
                            {
                                path: ":id",
                                element: <PrivateRoute handleForceChange={handleForceChange} element={<AuditLogs/>}/>
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


    if (anyLoading || ((currentForce !== "" && forceData[currentForce] === undefined) && !location.pathname.includes(`${BASE_URL}/erro`))) {
        return (
            <ThemeToggler>
                <CssBaseline />
                <Loader fullPage/>
            </ThemeToggler>
        );
    }

    return (
        <ThemeToggler>
            <CssBaseline />

            <LocalizationProvider dateAdapter={AdapterMoment}>
                <CurrentForce.Provider value={currentForce} key={currentForce}>
                    <ForcesData.Provider value={forceData}>
                        <RouterProvider router={router} />
                    </ForcesData.Provider>
                </CurrentForce.Provider>
            </LocalizationProvider>

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
        </ThemeToggler>
    );
}

export default App;
