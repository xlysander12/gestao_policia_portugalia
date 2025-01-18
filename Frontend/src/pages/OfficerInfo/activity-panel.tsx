import React, {useContext, useEffect, useState} from "react";
import style from "./officerinfo.module.css";
import {DefaultButton, DefaultTextField, DefaultTypography} from "../../components/DefaultComponents";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import Gate from "../../components/Gate/gate.tsx";
import {Divider, Skeleton} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {
    OfficerActiveJustification, OfficerActiveJustificationsResponse,
    OfficerLastShiftResponse, OfficerSpecificHoursResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {UpdateOfficerLastShiftBodyType} from "@portalseguranca/api-types/officers/activity/input";
import {padToTwoDigits, toHoursAndMinutes} from "../../utils/misc.ts";
import {InactivityJustificationModal, WeekHoursRegistryModal} from "../Activity/modals";
import {ForceDataContext, getObjectFromId} from "../../force-data-context.ts";

type LastShiftPairProps = {
    officer: number
}
const LastShiftPair = ({officer}: LastShiftPairProps) => {
    // Get the logged user context
    const loggedUser = useContext(LoggedUserContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [editMode, setEditMode] = useState<boolean>(false);

    const [lastShift, setLastShift] = useState<Date | null>(null);
    const [maxDaysPassed, setMaxDaysPassed] = useState<boolean>(false);


    async function fetchLastShift() {
        // Set the loading to true and editmode to false
        setLoading(true);
        setEditMode(false);

        // Clear current data
        setLastShift(null);

        // Fetch the API the last shift date
        let response = await make_request(`/officers/${officer}/activity/last-shift`, "GET");

        if (response.status === 404) {
            setLoading(false);
            return;
        }

        const responseJson: OfficerLastShiftResponse = await response.json();

        setLastShift(new Date(responseJson.data.last_shift));
        setMaxDaysPassed(responseJson.meta.passed_max_days);

        // Set loading to false
        setLoading(false);
    }

    async function updateOfficerLastShift() {
        // Set the loading to true
        setLoading(true);

        // Build the request body
        const requestBody: UpdateOfficerLastShiftBodyType = {
            last_shift: lastShift!.toISOString()
        }

        // Make the request
        await make_request(`/officers/${officer}/activity/last-shift`, "PUT", {body: requestBody});

        // Update the last shift date
        await fetchLastShift();
    }

    useEffect(() => {
        fetchLastShift();
    }, [officer]);

    return (
        <div className={style.informationPairDiv}>
            <label>Última picagem:</label>
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
                            {lastShift !== null ? `${padToTwoDigits(lastShift.getDate())}/${padToTwoDigits(lastShift.getMonth() + 1)}/${lastShift.getFullYear()}`: "N/A"}
                        </DefaultTypography>
                    </Gate>

                    <Gate show={editMode}>
                        <DefaultTextField
                            required
                            textWhenDisabled
                            disabled={!editMode}
                            type={"date"}
                            value={lastShift !== null ? lastShift.toISOString().split("T")[0]: ""}
                            onChange={(event) => setLastShift(new Date(event.target.value))}
                        />
                    </Gate>

                    <Gate show={loggedUser.intents["activity"] && editMode}>
                        <DefaultButton
                            size={"small"}
                            buttonColor={"lightgreen"}
                            onClick={() => {
                                // Call the onDateChange function
                                updateOfficerLastShift();
                            }}
                        >
                            Guardar
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
        let response = await make_request(`/officers/${officer}/activity/hours/last`, "GET");

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
        fetchLastWeekHours();
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
    const forceData = useContext(ForceDataContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setModalOpen] = useState<boolean>(false);
    const [activeJustification, setActiveJustification] = useState<OfficerActiveJustification | null>(null);

    async function fetchActiveJustification() {
        // Ensure loading is true
        setLoading(true);

        // Clear current data
        setActiveJustification(null);

        // Fetch the API the last week hours
        let response = await make_request(`/officers/${officer}/activity/justifications/active`, "GET");

        const responseJson: OfficerActiveJustificationsResponse = await response.json();

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
        fetchActiveJustification();
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

            <InactivityJustificationModal open={isModalOpen} onClose={() => setModalOpen(false)} officerNif={officer} justificationId={activeJustification?.id!}/>
        </>
    )
}

type ActivityPanelProps = {
    nif: number
}
export const ActivityPanel = ({nif}: ActivityPanelProps) => {
    return (
        <fieldset>
            <legend>Atividade</legend>
            <div className={style.officerInfoInnerFieldsetDiv}>
                <ActiveJustificationPair officer={nif} />
                <Divider/>
                <LastShiftPair officer={nif}/>
                <Divider/>
                <LastWeekHoursPair officer={nif}/>
            </div>
        </fieldset>
    );
}