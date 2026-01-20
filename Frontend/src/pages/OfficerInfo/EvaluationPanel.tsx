import style from "./officerinfo.module.css";
import styles from "./officerinfo.module.css";
import {Divider, Skeleton} from "@mui/material";
import {Link} from "react-router-dom";
import {useCallback, useEffect, useState} from "react";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import {
    AuthoredEvaluationsListResponse, EvaluationsListResponse,
    EvaluationSocket
} from "@portalseguranca/api-types/officers/evaluations/output";
import {toast} from "react-toastify";
import {useForceData, useWebSocketEvent} from "../../hooks";
import Gate from "../../components/Gate/gate.tsx";
import {DefaultTypography} from "../../components/DefaultComponents";
import { SOCKET_EVENT } from "@portalseguranca/api-types";
import { EvaluationDecision } from "@portalseguranca/api-types/util/output";
import {getObjectFromId} from "../../forces-data-context.ts";

type EvaluationsNumberPairProps = {
    nif: number
}
function EvaluationsNumberPair(props: EvaluationsNumberPairProps) {
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [cantSee, setCantSee] = useState<boolean>(false);
    const [evaluationsNumber, setEvaluationsNumber] = useState<number>(0);

    async function fetchNumber(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        let maxPages = 1; // Create a variable that will hold the number of pages existent
        let total = 0; // Create a variable that will hold the total number of evaluations

        for (let page = 1; page <= maxPages; page++) {
            // Make the request
            const response = await make_request(`officers/${props.nif}/evaluations/author`, RequestMethod.GET, {
                queryParams: [
                    {
                        key: "page",
                        value: page.toString()
                    },
                    {
                        key: "after",
                        value: forceData.last_ceremony.unix().toString()
                    }
                ],
                signal
            });
            const responseJson: AuthoredEvaluationsListResponse = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    setCantSee(true);
                    break;
                } else { // Unlikely to happen
                    toast.error(responseJson.message);
                    return;
                }
            }

            maxPages = responseJson.meta.pages; // Update the number of total pages this must search for
            total += responseJson.data.length; // Update the total number of evaluations found
        }

        // After the loop ends, set the evaluations number state
        setEvaluationsNumber(total);
        setCantSee(false);

        if (showLoading) setLoading(false);
    }

    useWebSocketEvent<EvaluationSocket>(SOCKET_EVENT.EVALUATIONS, useCallback((data) => {
        if (data.author !== props.nif) return; // Ignore evaluations not made by this officer

        if (!(["add", "delete"].includes(data.action))) return; // Ignore updates

        void fetchNumber(false);
    }, [props.nif]));

    useEffect(() => {
        const controller = new AbortController();

        void fetchNumber(true, controller.signal);

        return () => controller.abort();
    }, [props.nif]);

    return (
        <div className={style.informationPairDiv}>
            <label className={style.hoverableLabel}>
                <Link
                    to={`/avaliacoes/${props.nif}/autor`}
                    style={{
                        textDecoration: "none",
                        color: "var(--portalseguranca-color-accent)"
                    }}
                >
                    Avaliações feitas:
                </Link>
            </label>
            <Gate show={loading}>
                <Skeleton animation={"wave"} />
            </Gate>

            <Gate show={!loading}>
                <DefaultTypography
                    sx={{marginTop: "4px", filter: cantSee ? "blur(5px)": undefined}}
                >
                    {cantSee ? "Nem tentes..." : evaluationsNumber}
                </DefaultTypography>
            </Gate>
        </div>
    );
}


type EvaluationsAboutPairProps = {
    nif: number
}
function EvaluationsAboutPair(props: EvaluationsAboutPairProps) {
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [cantSee, setCantSee] = useState<boolean>(false);
    const [evaluationsNumber, setEvaluationsNumber] = useState<number>(0);

    async function fetchEvaluations(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        let maxPages = 1; // Create a variable that will hold the number of pages existent
        let total = 0; // Create a variable that will hold the total number of evaluations

        for (let page = 1; page <= maxPages; page++) {
            // Make the request
            const response = await make_request(`officers/${props.nif}/evaluations`, RequestMethod.GET, {
                queryParams: [
                    {
                        key: "page",
                        value: page.toString()
                    },
                    {
                        key: "after",
                        value: forceData.last_ceremony.unix().toString()
                    }
                ],
                signal
            });
            const responseJson: AuthoredEvaluationsListResponse = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    setCantSee(true);

                    if (showLoading) setLoading(false);
                    return;
                } else { // Unlikely to happen
                    toast.error(responseJson.message);
                    return;
                }
            }

            maxPages = responseJson.meta.pages; // Update the number of total pages this must search for
            total += responseJson.data.length; // Update the total number of evaluations found
        }

        // After the loop ends, set the evaluations number state
        setEvaluationsNumber(total);
        setCantSee(false);

        if (showLoading) setLoading(false);
    }

    useWebSocketEvent<EvaluationSocket>(SOCKET_EVENT.EVALUATIONS, useCallback((data) => {
        if (data.target !== props.nif) return; // Ignore evaluations not about this officer

        if (!(["add", "delete"].includes(data.action))) return; // Ignore updates

        void fetchEvaluations(false);
    }, [props.nif]));

    useEffect(() => {
        const controller = new AbortController();

        void fetchEvaluations(true, controller.signal);

        return () => controller.abort();
    }, [props.nif]);

    return (
        <div className={style.informationPairDiv}>
            <label>
                    Avaliações sobre:
            </label>
            <Gate show={loading}>
                <Skeleton animation={"wave"} />
            </Gate>

            <Gate show={!loading}>
                <DefaultTypography
                    sx={{marginTop: "4px", filter: cantSee ? "blur(5px)": undefined}}
                >
                    {cantSee ? "Nem tentes..." : evaluationsNumber}
                </DefaultTypography>
            </Gate>
        </div>
    );
}

type AverageDecisionPairProps = {
    nif: number
}
function AverageDecisionPair(props: AverageDecisionPairProps) {
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [cantSee, setCantSee] = useState<boolean>(false);
    const [decision, setDecision] = useState<EvaluationDecision | null>();

    async function fetchAverageDecision(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);
        // Make the request
        const response = await make_request(`officers/${props.nif}/evaluations`, RequestMethod.GET, {
            queryParams: [
                {
                    key: "after",
                    value: forceData.last_ceremony.unix().toString()
                }
            ],
            signal
        });
        const responseJson: EvaluationsListResponse = await response.json();

        if (!response.ok) {
            if (response.status === 403) {
                setCantSee(true);
                if (showLoading) setLoading(false);
                return;
            } else { // Unlikely to happen
                toast.error(responseJson.message);
                return;
            }
        }

        // If the request went smoothly, store the average decision
        setDecision(getObjectFromId(responseJson.meta.averages["decision"], forceData.evaluation_decisions));
        setCantSee(false);

        if (showLoading) setLoading(false);
    }

    useWebSocketEvent<EvaluationSocket>(SOCKET_EVENT.EVALUATIONS, useCallback((data) => {
        if (data.target !== props.nif) return; // Ignore evaluations not made by this officer

        void fetchAverageDecision(false);
    }, [props.nif]));

    useEffect(() => {
        const controller = new AbortController();

        void fetchAverageDecision(true, controller.signal);

        return () => controller.abort();
    }, [props.nif]);

    return (
        <div className={style.informationPairDiv}>
            <label>
                Opinião média:
            </label>
            <Gate show={loading}>
                <Skeleton animation={"wave"} />
            </Gate>

            <Gate show={!loading}>
                <DefaultTypography
                    color={cantSee || !decision ? undefined : decision.color}
                    sx={{marginTop: "4px", filter: cantSee ? "blur(5px)": undefined}}
                >
                    {cantSee ? "Nem tentes..." : (decision ? decision.name : "N/A")}
                </DefaultTypography>
            </Gate>
        </div>
    );
}

type EvaluationPanelProps = {
    nif: number
}
function EvaluationPanel(props: EvaluationPanelProps) {
    return (
        <fieldset>
            <legend
                className={styles.activityPanelLabel}
            >
                <Link
                    to={`/avaliacoes/${props.nif}`}
                    style={{
                        textDecoration: "none",
                        color: "var(--portalseguranca-color-accent)"
                    }}
                >
                    Avaliações
                </Link>
            </legend>
            <div className={style.officerInfoInnerFieldsetDiv}>
                <EvaluationsNumberPair nif={props.nif}/>
                <Divider/>
                <EvaluationsAboutPair nif={props.nif} />
                <Divider/>
                <AverageDecisionPair nif={props.nif} />
            </div>
        </fieldset>
    );
}

export default EvaluationPanel;