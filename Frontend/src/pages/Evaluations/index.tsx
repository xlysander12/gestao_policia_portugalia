import style from "./evaluations.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {OfficerPicker} from "../../components/OfficerPicker";
import {useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {EvaluationsListResponse, MinifiedEvaluation} from "@portalseguranca/api-types/officers/evaluations/output";
import ManagementBar from "../../components/ManagementBar";
import {make_request} from "../../utils/requests.ts";
import { toast } from "react-toastify";
import Gate from "../../components/Gate/gate.tsx";
import {Loader} from "../../components/Loader";
import {DefaultTypography} from "../../components/DefaultComponents";
import InformationCard from "../../components/InformationCard";
import {getObjectFromId} from "../../forces-data-context.ts";
import {useForceData} from "../../hooks";

function Evaluations() {
    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Get the force's data from context
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [currentOfficer, setCurrentOfficer] = useState<MinifiedOfficerData>({
        name: loggedUser.info.personal.name,
        patent: loggedUser.info.professional.patent.id,
        callsign: loggedUser.info.professional.callsign,
        status: loggedUser.info.professional.status.id,
        nif: loggedUser.info.personal.nif,
    });
    const [asAuthor, setAsAuthor] = useState<boolean>(false);

    const [evaluations, setEvaluations] = useState<MinifiedEvaluation[]>([]);

    async function fetchEvaluations(showLoading: boolean = true) {
        if (showLoading) setLoading(true);

        // Fetch evaluations from the API
        const response = await make_request(`/officers/${currentOfficer.nif}/evaluations${asAuthor ? "/author": ""}`, "GET");
        const response_json: EvaluationsListResponse = await response.json();

        if (!response.ok) {
            toast.error(response_json.message);
            return;
        }

        // Apply the evaluations to the state
        setEvaluations(response_json.data);

        // Disable loading
        if (showLoading) setLoading(false);
    }

    useEffect(() => {
        fetchEvaluations();
    }, [currentOfficer.nif, asAuthor]);

    return (
        <>
            <ScreenSplit
                leftSideComponent={
                    <OfficerPicker
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
                        <>

                        </>
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
                                      <InformationCard
                                          key={`evaluation#${evaluation.id}`}
                                          callback={() => console.log(evaluation.id)}
                                          statusColor={getObjectFromId(evaluation.average, forceData.evaluation_grades)!.color}
                                      >
                                          <DefaultTypography>teste</DefaultTypography>
                                      </InformationCard>
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