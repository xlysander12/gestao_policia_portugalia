import style from "./evaluations.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {OfficerPicker} from "../../components/OfficerPicker";
import {useCallback, useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import {
    MinifiedOfficerData,
    OfficerInfoGetResponse,
    OfficerListResponse
} from "@portalseguranca/api-types/officers/output";
import {
    EvaluationsListResponse,
    EvaluationSocket,
    MinifiedEvaluation
} from "@portalseguranca/api-types/officers/evaluations/output";
import ManagementBar from "../../components/ManagementBar";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import { toast } from "react-toastify";
import Gate from "../../components/Gate/gate.tsx";
import {Loader} from "../../components/Loader";
import {DefaultButton, DefaultPagination, DefaultSearch, DefaultTypography} from "../../components/DefaultComponents";
import {useForceData, useWebSocketEvent} from "../../hooks";
import {EvaluationCard} from "./components/EvaluationCard";
import {
    FormControlLabel,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from "@mui/material";
import {getObjectFromId} from "../../forces-data-context.ts";
import {SOCKET_EVENT} from "@portalseguranca/api-types";
import {EvaluationModal} from "./modals";
import {useNavigate, useParams} from "react-router-dom";
import ShareButton from "../../components/ShareButton";

type EvaluationsPageProps = {
    asAuthor?: boolean
}
function Evaluations(props: EvaluationsPageProps) {
    // Get possible params from the URL
    const {nif, entry_id} = useParams();

    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Initialize the navigate hook
    const navigate = useNavigate();

    // Get the force's data from context
    const [forceData] = useForceData();

    // Loading flag
    const [loading, setLoading] = useState<boolean>(true);
    const [officerLoading, setOfficerLoading] = useState<boolean>(false);

    // Current Officer State
    const [currentOfficer, setCurrentOfficer] = useState<MinifiedOfficerData>({
        name: loggedUser.info.personal.name,
        patent: loggedUser.info.professional.patent.id,
        callsign: loggedUser.info.professional.callsign,
        status: loggedUser.info.professional.status.id,
        nif: loggedUser.info.personal.nif
    });

    // Page handling
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Author flag
    const [asAuthor, setAsAuthor] = useState<boolean>(!!props.asAuthor || nif === undefined || isNaN(parseInt(nif)) || parseInt(nif) === loggedUser.info.personal.nif);

    // List of evaluations
    const [evaluations, setEvaluations] = useState<MinifiedEvaluation[]>([]);

    // List of averages
    const [averages, setAverages] = useState<{[key: number]: number}>({});

    // List of selected filters
    const [filters, setFilters] = useState<{key: string, value: string}[]>([]);

    // Modal Control States
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
    const [isNewEntry, setIsNewEntry] = useState<boolean>(false);
    const [evaluationOfficerNif, setEvaluationOfficerNif] = useState<number | null>(null);

    // Variable that sets if the averages table should be shown
    const showAverages = !loading && !asAuthor && evaluations.length > 0;

    async function fetchOfficerInfo(signal?: AbortSignal) {
        // Set the loading flag to true
        setOfficerLoading(true);

        // Query the server to get the data of the Officer
        const response = await make_request(`/officers/${nif}`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as OfficerInfoGetResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setCurrentOfficer({
                name: loggedUser.info.personal.name,
                patent: loggedUser.info.professional.patent.id,
                callsign: loggedUser.info.professional.callsign,
                status: loggedUser.info.professional.status.id,
                nif: loggedUser.info.personal.nif
            });
            setAsAuthor(true);
            return;
        }

        setCurrentOfficer({
            name: responseJson.data.name,
            patent: responseJson.data.patent,
            callsign: responseJson.data.callsign,
            status: responseJson.data.status,
            nif: responseJson.data.nif,
        });

        // Set the loading flag to false
        setOfficerLoading(false);
    }

    async function fetchEvaluations(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        // Fetch evaluations from the API
        const response = await make_request(`/officers/${currentOfficer.nif}/evaluations${asAuthor ? "/author": ""}`, "GET", {
            queryParams: [{key: "page", value: String(page)}, ...filters],
            signal
        });
        const response_json: EvaluationsListResponse = await response.json();

        if (!response.ok) {
            toast.error(response_json.message);
            return;
        }

        // Apply the evaluations to the state
        setEvaluations(response_json.data);

        // Apply the total pages to the state
        setTotalPages(response_json.meta.pages);

        // Apply the averages to the state
        setAverages(response_json.meta.averages);

        // Disable loading
        if (showLoading) setLoading(false);
    }

    // Update from the websocket event
    useWebSocketEvent<EvaluationSocket>(SOCKET_EVENT.EVALUATIONS, useCallback(async (data) => {
        // If the evaluation that changed is about the current selected officer, reload the parameters
        if ((data.target === currentOfficer.nif && !asAuthor) || (data.author === currentOfficer.nif && asAuthor)) {
            await fetchEvaluations(false);
        }
    }, [currentOfficer.nif, asAuthor]));

    // Everytime any settings change, reload the evaluations
    useEffect(() => {
        const controller = new AbortController;
        const signal = controller.signal;

        //If "asAuthor" is true, check wether it can remain like that, or not
        if (asAuthor && !loggedUser.intents.evaluations && currentOfficer.nif !== loggedUser.info.personal.nif) {
            setAsAuthor(false);
        } else {
            void fetchEvaluations(true, signal);
        }

        return () => {
            controller.abort();
        }
    }, [currentOfficer.nif, asAuthor, JSON.stringify(filters), loggedUser.intents.evaluations, loggedUser.info.personal.nif, page]);

    // Everytime the nif param changes, load the new officer's info
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (nif && !isNaN(parseInt(nif))) {
            void fetchOfficerInfo(signal);
        }

        if (nif && !isNaN(parseInt(nif)) && entry_id && !isNaN(parseInt(entry_id))) {
            setSelectedId(parseInt(entry_id));
            setIsNewEntry(false);
            setEvaluationOfficerNif(parseInt(nif));
            setModalOpen(true);
        }

        return () => controller.abort();
    }, [nif, entry_id]);

    // If the logged user can't make evaluations, don't allow them to view this page
    if (loggedUser.info.professional.patent.max_evaluation <= 0) {
        toast.error("Não tens permissão para visitar esta página");
        navigate("/");
        return;
    }

    return (
        <>
            <ScreenSplit
                leftSideComponent={
                    <OfficerPicker
                        disabled={loading}
                        callback={(officer) => {
                            // Set the current page to 1
                            setPage(1);

                            // If, on changing, the target user isn't the logged user and the logged user doesn't have the "evaluations" intent, set "asAuthor" to false
                            if (officer.nif !== loggedUser.info.personal.nif && asAuthor && !loggedUser.intents.evaluations) {
                                setAsAuthor(false);
                            } else if (officer.nif === loggedUser.info.personal.nif && !asAuthor) {
                                setAsAuthor(true);
                            }

                            // Set the target officer
                            setCurrentOfficer(officer);
                        }}
                        filter={(officer) =>
                            officer.nif === loggedUser.info.personal.nif ||
                            asAuthor && loggedUser.intents.evaluations ? officer.patent <= loggedUser.info.professional.patent.id :
                                officer.patent <= loggedUser.info.professional.patent.max_evaluation
                        }
                    />
                }
                leftSidePercentage={35}
            >
                <>
                    <ManagementBar>
                        <div className={style.managementBarMain}>
                            <div className={style.managementBarLeft}>
                                <div>
                                    <FormControlLabel
                                        disabled={loading ||
                                            currentOfficer.nif === loggedUser.info.personal.nif ||
                                            !loggedUser.intents.evaluations ||
                                            currentOfficer.patent > loggedUser.info.professional.patent.max_evaluation

                                        }
                                        control={<Switch onChange={(event) => setAsAuthor(event.target.checked)}/>}
                                        labelPlacement={"end"}
                                        label={"Autoria"}
                                        checked={asAuthor}
                                        slotProps={{
                                            typography: {
                                                color: "white"
                                            }
                                        }}
                                    />

                                    <DefaultTypography color={"white"} fontSize={"small"}>{getObjectFromId(currentOfficer.patent, forceData.patents)!.name} {currentOfficer.name}</DefaultTypography>
                                </div>
                                <DefaultSearch
                                    fullWidth
                                    placeholder={"Pesquisar por avaliação"}
                                    callback={(options) => {
                                        setFilters(options);
                                        setPage(1);
                                    }}
                                    options={[
                                        {label: "Depois de", key: "after", type: "date"},
                                        {label: "Antes de", key: "before", type: "date"},
                                        {label: "Com Patrulha", key: "withPatrol", type: "boolean"},
                                        {label: asAuthor ? "Efetivo" : "Autor", key: asAuthor ? "target" : "author", type: "asyncOption",
                                            optionsFunc: async (signal) => {
                                                const officers = await make_request("/officers", "GET", {signal: signal});
                                                const officersData = await officers.json() as OfficerListResponse;

                                                if (!officers.ok) {
                                                    toast.error(officersData.message);
                                                    return [];
                                                }

                                                return officersData.data.map(officer => {
                                                    return {
                                                        label: `[${officer.callsign}] ${getObjectFromId(officer.patent, forceData.patents)!.name} ${officer.name}`,
                                                        key: String(officer.nif)
                                                    }
                                                });
                                            }
                                        }
                                    ]}
                                    defaultFilters={forceData.last_ceremony.isValid() ?[
                                        {
                                            label: "Depois de",
                                            key: "after",
                                            value: forceData.last_ceremony.unix(),
                                            labelValue: forceData.last_ceremony.format("DD/MM/YYYY")
                                        }
                                    ] : undefined}
                                />

                                <ShareButton url={`/avaliacoes/${currentOfficer.nif}${asAuthor ? "/autor": ""}`} color={"var(--portalseguranca-color-accent)"}/>
                            </div>

                            <div className={style.managementBarRight}>
                                <DefaultPagination
                                    disabled={loading}
                                    variant={"outlined"}
                                    showFirstButton
                                    page={page}
                                    count={totalPages}

                                    onChange={(_, page) => setPage(page)}
                                />
                                <Gate show={!asAuthor && (!officerLoading || currentOfficer.status !== -1)}>
                                    <DefaultButton
                                        onClick={() => {
                                            setIsNewEntry(true);
                                            setModalOpen(true);
                                        }}
                                    >
                                        Criar Avaliação
                                    </DefaultButton>
                                </Gate>
                            </div>
                        </div>
                    </ManagementBar>

                    {/*List of Evaluations*/}
                    <Gate show={showAverages}>
                        <TableContainer sx={{boxSizing: "border-box", padding: "0 1px 0 0"}}>
                            <Table size={"small"} padding={"normal"} sx={{height: "70px"}}>
                                <TableHead>
                                    <TableRow>
                                        {averages ? Object.keys(averages).map(avg => {
                                            return (
                                                <TableCell
                                                    key={`averageField#${avg}`}
                                                    align={"center"}
                                                    sx={{
                                                        color: "var(--portalseguranca-color-text-light)",
                                                        border: "1px solid var(--portalseguranca-color-background-light)",
                                                        backgroundColor: "var(--portalseguranca-color-background-dark)"
                                                    }}>
                                                    {getObjectFromId(parseInt(avg), forceData.evaluation_fields)!.name}
                                                </TableCell>
                                            );
                                        }): (<></>)}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    <TableRow>
                                        {averages ? Object.keys(averages).map(avg => {
                                            // Get the grade
                                            const grade = getObjectFromId(averages[parseInt(avg)], forceData.evaluation_grades)!;

                                            return (
                                                <TableCell
                                                    key={`averageGrade#${avg}`}
                                                    align={"center"}
                                                    sx={{color: "var(--portalseguranca-color-text-dark)",
                                                        backgroundColor: grade.color,
                                                        border: "1px solid var(--portalseguranca-color-background-dark)"
                                                    }}
                                                >
                                                        {grade.name}
                                                </TableCell>
                                            );
                                        }): (<></>)}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Gate>

                    <div className={`${style.evaluationsDiv} ${showAverages ? style.evaluationsDivWithTable : ""}`}>
                        <Gate show={loading}>
                            <Loader fullDiv />
                        </Gate>

                        <Gate show={!loading}>
                            <Gate show={evaluations.length === 0}>
                                <DefaultTypography color={"black"} fontSize={"xx-large"}>Sem Resultados</DefaultTypography>
                            </Gate>

                            <Gate show={evaluations.length > 0}>
                                {evaluations.map(evaluation => {
                                    return (
                                        <EvaluationCard
                                            key={`evaluation#${evaluation.id}`}
                                            evaluation={evaluation}
                                            callback={() => {
                                                setSelectedId(evaluation.id);
                                                setModalOpen(true);
                                                setEvaluationOfficerNif(evaluation.target);
                                            }}
                                        />
                                    );
                                })}
                            </Gate>
                        </Gate>
                    </div>
                </>
            </ScreenSplit>

            <EvaluationModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setIsNewEntry(false);
                }}
                officerNif={evaluationOfficerNif ?? 0}
                officerData={currentOfficer}
                id={selectedId}
                newEntry={isNewEntry}
            />
        </>
    );
}

export default Evaluations;