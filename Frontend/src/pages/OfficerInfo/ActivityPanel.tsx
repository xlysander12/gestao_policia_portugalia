import React, {useContext, useEffect, useMemo, useState} from "react";
import style from "./officerinfo.module.css";
import styles from "./officerinfo.module.css";
import {DefaultButton, DefaultDatePicker, DefaultTypography} from "../../components/DefaultComponents";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import Gate from "../../components/Gate/gate.tsx";
import {Divider, Skeleton} from "@mui/material";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import {
    OfficerActiveJustification,
    OfficerActiveJustificationsResponse,
    OfficerLastDateResponse,
    OfficerSpecificHoursResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {UpdateOfficerLastDateBodyType} from "@portalseguranca/api-types/officers/activity/input";
import {toHoursAndMinutes} from "../../utils/misc.ts";
import {InactivityJustificationModal, WeekHoursRegistryModal} from "../Activity/modals";
import {getObjectFromId} from "../../forces-data-context.ts";
import {useForceData} from "../../hooks";
import moment, {Moment} from "moment";
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {Link} from "react-router-dom";
import { toast } from "react-toastify";
import { LastDatesField } from "@portalseguranca/api-types/util/output";

type LastDatePairProps = {
    officer: number
    field: LastDatesField
}
const LastDatePair = (props: LastDatePairProps) => {
    // Get the logged user context
    const loggedUser = useContext(LoggedUserContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [editMode, setEditMode] = useState<boolean>(false);

    const [lastDate, setLastDate] = useState<Moment>(moment(null));

    const maxDaysPassed = useMemo(() => {
        if (!lastDate.isValid()) return false;
        
        if (props.field.max_days === null) return false;
        
        const daysPassed = moment().diff(lastDate, 'days');
        
        return daysPassed > props.field.max_days;
    }, [lastDate.unix(), props.field]);

    async function fetchLastDate(showLoading = true, signal?: AbortSignal) {
        // Set the loading to true
        if (showLoading) setLoading(true);

        // Set Editmode to false
        setEditMode(false);

        // Fetch the API the last date for the field
        const response = await make_request(`/officers/${props.officer}/activity/last-dates/${props.field.id}`, RequestMethod.GET, {signal});
        const responseJson: OfficerLastDateResponse = await response.json();

        if (response.status === 404) {
            setLoading(false);
            setLastDate(moment(null));
            return;
        } else if (!response.ok) {
            setLoading(false);
            toast.error(responseJson.message);
            return;
        }

        setLastDate(moment.unix(responseJson.data.date));

        // Set loading to false
        if (showLoading) setLoading(false);
    }

    async function updateOfficerLastShift() {
        // Set the loading to true
        setLoading(true);

        // Make the request
        await make_request<UpdateOfficerLastDateBodyType>(`/officers/${props.officer}/activity/last-dates/${props.field.id}`, RequestMethod.PATCH, {
            body: {
                date: lastDate.unix()
            }
        });

        // Update the last shift date
        await fetchLastDate();
    }

    useEffect(() => {
        const controller = new AbortController();

        void fetchLastDate(true, controller.signal);

        return () => controller.abort();
    }, [props.officer, props.field]);

    return (
        <div className={style.informationPairDiv}>
            <label>{props.field.display}:</label>
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "10px"
                }}
            >
                <Gate show={loading}>
                    <Skeleton
                        variant={"text"}
                        animation={"wave"}
                        width={"30%"}
                    />
                </Gate>

                <Gate show={!loading}>
                    <Gate show={!editMode}>
                        <DefaultTypography
                            color={maxDaysPassed ? "red": "var(--portalseguranca-color-text-light)"}
                            sx={{marginTop: "4px"}}
                            clickable={loggedUser.intents["activity"]}
                            onClick={() => {
                                if (loggedUser.intents["activity"]) {
                                    setEditMode(true);
                                }
                            }}
                        >
                            {lastDate.isValid() ? lastDate.format("DD/MM/YYYY"): "N/A"}
                        </DefaultTypography>
                    </Gate>

                    <Gate show={editMode}>
                        <DefaultDatePicker
                            textWhenDisabled
                            disableFuture
                            disabled={!editMode}
                            value={moment(lastDate)}
                            onChange={(date) => setLastDate(date ? date: moment(null))}
                            slotProps={{
                                field: {
                                    clearable: true
                                }
                            }}
                        />
                    </Gate>

                    <Gate show={loggedUser.intents["activity"] && editMode}>
                        <DefaultButton
                            size={"small"}
                            buttonColor={"lightgreen"}
                            darkTextOnHover
                            onClick={() => {
                                // Call the onDateChange function
                                void updateOfficerLastShift();
                            }}
                        >
                            <SaveIcon fontSize={"small"} />
                        </DefaultButton>

                        <DefaultButton
                            size={"small"}
                            buttonColor={"red"}
                            onClick={() => {
                                setEditMode(false);
                                void fetchLastDate();
                            }}
                        >
                            <CancelIcon fontSize={"small"} />
                        </DefaultButton>
                    </Gate>
                </Gate>
            </div>
        </div>
    );
}

type LastWeekHoursPairProps = {
    officer: number
}
const LastWeekHoursPair = ({officer}: LastWeekHoursPairProps) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setModalOpen] = useState<boolean>(false);

    const [lastHours, setLastHours] = useState<{id: number, minutes: number} | null>(null);
    const [didMinHours, setDidMinHours] = useState<boolean>(false);

    async function fetchLastWeekHours() {
        // Ensure loading is true
        setLoading(true);

        // Clear current data
        setLastHours(null);

        // Fetch the API the last week hours
        const response = await make_request(`/officers/${officer}/activity/hours/last`, "GET");

        // If response is 404, there are no registry of this officer
        if (response.status === 404) {
            setLoading(false);
            return;
        }

        const responseJson: OfficerSpecificHoursResponse = await response.json();
        setLastHours({
            id: responseJson.data.id,
            minutes: responseJson.data.minutes
        });
        setDidMinHours(responseJson.meta.min_hours);

        // Set loading to false
        setLoading(false);
    }

    useEffect(() => {
        void fetchLastWeekHours();
    }, [officer]);

    return (
        <>
            <div className={style.informationPairDiv}>
                <label>Últimos minutos (horas):</label>
                <Gate show={loading}>
                    <Skeleton
                        variant={"text"}
                        animation={"wave"}
                        width={"30%"}
                    />
                </Gate>
                <Gate show={!loading}>
                    <DefaultTypography
                        sx={{marginTop: "4px"}}
                        color={lastHours?.minutes ? (!didMinHours ? "red": "var(--portalseguranca-color-text-light)"): "var(--portalseguranca-color-text-light)"}
                        clickable={!!lastHours?.minutes}
                        onClick={() => setModalOpen(true)}
                    >
                        {lastHours?.minutes ? lastHours?.minutes : "N/A"} ({lastHours?.minutes ? toHoursAndMinutes(lastHours?.minutes) : "N/A"})
                    </DefaultTypography>
                </Gate>
            </div>

            <WeekHoursRegistryModal open={isModalOpen} onClose={() => setModalOpen(false)} officer={officer} entryId={lastHours?.id ? lastHours?.id: undefined}/>
        </>
    )
}

type ActiveJustificationPairProps = {
    officer: number
}
const ActiveJustificationPair = ({officer}: ActiveJustificationPairProps) => {
    // Get force data from context
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setModalOpen] = useState<boolean>(false);
    const [activeJustification, setActiveJustification] = useState<OfficerActiveJustification | null>(null);

    async function fetchActiveJustification() {
        // Ensure loading is true
        setLoading(true);

        // Clear current data
        setActiveJustification(null);

        // Fetch the API the last week hours
        const response = await make_request(`/officers/${officer}/activity/justifications/active`, "GET");

        const responseJson: OfficerActiveJustificationsResponse = await response.json();

        // If the response is 404, the officer doesn't exist, probably a former officer
        if (response.status === 404) {
            setLoading(false);
            return;
        }

        // If there are no justifications, set loading to false and return
        if (responseJson.data.length === 0) {
            setLoading(false);
            return;
        }

        // If there's multiple justifications, prioritize the one with the highest type
        if (responseJson.data.length > 1) {
            responseJson.data.sort((a: OfficerActiveJustification, b: OfficerActiveJustification) => {
                return b.type - a.type;
            });
        }

        setActiveJustification(responseJson.data[0]);

        // Set loading to false
        setLoading(false);
    }

    useEffect(() => {
        void fetchActiveJustification();
    }, [officer]);

    return (
        <>
            <div className={style.informationPairDiv}>
                <label>Justificação ativa:</label>
                <Gate show={loading}>
                    <Skeleton
                        variant={"text"}
                        animation={"wave"}
                        width={"30%"}
                    />
                </Gate>
                <Gate show={!loading}>
                    <DefaultTypography
                        sx={{marginTop: "4px"}}
                        color={activeJustification ? (getObjectFromId(activeJustification.type, forceData.inactivity_types)!.color): "var(--portalseguranca-color-text-light)"}
                        clickable={!!activeJustification}
                        onClick={() => setModalOpen(true)}
                    >
                        {activeJustification ? getObjectFromId(activeJustification?.type, forceData.inactivity_types)!.name : "N/A"}
                    </DefaultTypography>
                </Gate>
            </div>

            <InactivityJustificationModal open={isModalOpen} onClose={() => setModalOpen(false)} officerNif={officer} justificationId={activeJustification ? activeJustification.id: -1}/>
        </>
    )
}

type ActivityPanelProps = {
    nif: number
}
export const ActivityPanel = ({nif}: ActivityPanelProps) => {
    // Get force data
    const [forceData] = useForceData();

    return (
        <fieldset>

            <legend
                className={styles.activityPanelLabel}
            >
                <Link
                    to={`/atividade/${nif}`}
                    style={{
                        textDecoration: "none",
                        color: "var(--portalseguranca-color-accent)"
                    }}
                >
                    Atividade
                </Link>
            </legend>
            <div className={style.officerInfoInnerFieldsetDiv}>
                <ActiveJustificationPair officer={nif} />
                <Divider/>
                <LastWeekHoursPair officer={nif}/>
                <Divider/>
                {forceData.last_dates_fields.map((field, index) => (
                    <>
                        <LastDatePair key={`lastDate#${field.id}`} field={field} officer={nif}/>
                        <Gate show={index !== (forceData.last_dates_fields.length - 1)}>
                            <Divider/>
                        </Gate>
                    </>
                ))}

            </div>
        </fieldset>
    );
}