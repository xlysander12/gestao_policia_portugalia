import style from "./evaluations.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {OfficerPicker} from "../../components/OfficerPicker";
import {useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import {MinifiedOfficerData, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import {EvaluationsListResponse, MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import ManagementBar from "../../components/ManagementBar";
import {make_request} from "../../utils/requests.ts";
import { toast } from "react-toastify";
import Gate from "../../components/Gate/gate.tsx";
import {Loader} from "../../components/Loader";
import {DefaultButton, DefaultPagination, DefaultSearch, DefaultTypography} from "../../components/DefaultComponents";
import {useForceData} from "../../hooks";
import {EvaluationCard} from "./components/EvaluationCard";
import {FormControlLabel, Switch} from "@mui/material";
import {getObjectFromId} from "../../forces-data-context.ts";

function Evaluations() {
    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Get the force's data from context
    const [forceData] = useForceData();

    // Loading flag
    const [loading, setLoading] = useState<boolean>(true);

    // Current Officer State
    const [currentOfficer, setCurrentOfficer] = useState<MinifiedOfficerData>({
        name: loggedUser.info.personal.name,
        patent: loggedUser.info.professional.patent.id,
        callsign: loggedUser.info.professional.callsign,
        status: loggedUser.info.professional.status.id,
        nif: loggedUser.info.personal.nif,
    });

    // Page handling
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Author flag
    const [asAuthor, setAsAuthor] = useState<boolean>(false);

    // List of evaluations
    const [evaluations, setEvaluations] = useState<MinifiedEvaluation[]>([]);

    async function fetchEvaluations(showLoading: boolean = true, filters?: {key: string, value: string}[]) {
        if (showLoading) setLoading(true);

        // Fetch evaluations from the API
        const response = await make_request(`/officers/${currentOfficer.nif}/evaluations${asAuthor ? "/author": ""}`, "GET", {
            queryParams: filters ? [{key: "page", value: String(page)}, ...filters] : [{key: "page", value: String(page)}]
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

        // Disable loading
        if (showLoading) setLoading(false);
    }

    useEffect(() => {
        void fetchEvaluations();
    }, [currentOfficer.nif, asAuthor]);

    return (
        <>
            <ScreenSplit
                leftSideComponent={
                    <OfficerPicker
                        disabled={loading}
                        callback={setCurrentOfficer}
                        filter={(officer) =>
                            asAuthor ? officer.patent <= loggedUser.info.professional.patent.id :
                                officer.patent < loggedUser.info.professional.patent.id}
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
                                    callback={(options) => void fetchEvaluations(true, options)}
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
                                />
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
                                <DefaultButton>Criar Avaliação</DefaultButton>
                            </div>
                        </div>
                    </ManagementBar>

                    {/*List of Evaluations*/}
                    <div className={style.evaluationsDiv}>
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
                                            callback={() => console.log(evaluation.id)}
                                        />
                                    );
                                })}
                            </Gate>
                        </Gate>
                    </div>
                </>
            </ScreenSplit>
        </>
    );
}

export default Evaluations;