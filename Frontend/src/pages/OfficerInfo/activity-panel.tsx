import React, {useContext, useEffect, useState} from "react";
import style from "./officerinfo.module.css";
import {DefaultButton, DefaultTextField, DefaultTypography} from "../../components/DefaultComponents";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import Gate from "../../components/Gate/gate.tsx";
import {Divider, Skeleton} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {
    OfficerLastShiftResponse,
    OfficerSpecificHoursResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {UpdateOfficerLastShiftBodyType} from "@portalseguranca/api-types/officers/activity/input";
import {toHoursAndMinutes} from "../../utils/misc.ts";
import {WeekHoursRegistryModal} from "../Activity/modals";

type LastShiftPairProps = {
    date: Date | null,
    onDateChange?: (date: Date) => void
}
const LastShiftPair = ({date, onDateChange}: LastShiftPairProps) => {
    // Get the logged user context
    const loggedUser = useContext(LoggedUserContext);

    const [dateState, setDate] = useState<Date | null>(date);
    const [editMode, setEditMode] = useState<boolean>(false);


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
                <Gate show={!editMode}>
                    <DefaultTypography
                        sx={{marginTop: "4px"}}
                        clickable={loggedUser.intents["activity"]}
                        onClick={() => {
                            if (loggedUser.intents["activity"]) {
                                setEditMode(true);
                            }
                        }}
                    >
                        {dateState !== null ? `${dateState.getDate()}/${dateState.getMonth()}/${dateState.getFullYear()}`: "N/A"}
                    </DefaultTypography>
                </Gate>

                <Gate show={editMode}>
                    <DefaultTextField
                        required
                        sameTextColorWhenDisabled
                        disabled={!editMode}
                        type={"date"}
                        value={dateState !== null ? dateState.toISOString().split("T")[0]: ""}
                        onChange={(event) => setDate(new Date(Date.parse(event.target.value)))}
                    />
                </Gate>

                <Gate show={loggedUser.intents["activity"] && editMode}>
                    <DefaultButton
                        size={"small"}
                        buttonColor={"lightgreen"}
                        onClick={() => {
                            // Call the onDateChange function
                            if (onDateChange) {
                                onDateChange(dateState!);
                            }

                            // Disable the editing mode for the last shift date
                            setEditMode(false);
                        }}
                        >
                        Guardar
                    </DefaultButton>
                </Gate>
            </div>
        </div>
    );
}

type LastWeekHoursProps = {
    id: number | null
    minutes: number | null
    officer: number
}
const LastWeekHours = ({id, minutes, officer}: LastWeekHoursProps) => {
    const [isModalOpen, setModalOpen] = useState<boolean>(false);

    return (
        <>
            <div className={style.informationPairDiv}>
                <label>Últimos minutos (horas):</label>
                <DefaultTypography
                    sx={{marginTop: "4px"}}
                    color={minutes ? (minutes < 300 ? "red": "var(--portalseguranca-color-text-light)"): "var(--portalseguranca-color-text-light)"}
                    clickable={!!minutes}
                    onClick={() => setModalOpen(true)}
                >
                    {minutes ? minutes : "N/A"} ({minutes ? toHoursAndMinutes(minutes) : "N/A"})
                </DefaultTypography>
            </div>

            <WeekHoursRegistryModal open={isModalOpen} onClose={() => setModalOpen(false)} officer={officer} entryId={id ? id: undefined}/>
        </>
    )
}

type ActivityPanelProps = {
    nif: number
}
export const ActivityPanel = ({nif}: ActivityPanelProps) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [lastShift, setLastShift] = useState<Date | null>(null);
    const [lastWeekHours, setLastWeekHours] = useState<{ id: number, minutes: number } | null>(null);

    const fetchLastShift = async () => {
        // Fetch the API the last shift date
        let response = await make_request(`/officers/${nif}/activity/last-shift`, "GET");

        if (response.status === 404) {
            return null;
        }

        const responseJson = await response.json();

        setLastShift(new Date(Date.parse((responseJson as OfficerLastShiftResponse).data.last_shift)));
    }

    const fetchLastWeekHours = async () => {
        // Fetch the API the last week hours
        let response = await make_request(`/officers/${nif}/activity/hours/last`, "GET");

        if (response.status === 404) {
            return null;
        }

        const responseJson: OfficerSpecificHoursResponse = await response.json();

        setLastWeekHours({
            id: responseJson.data.id,
            minutes: responseJson.data.minutes
        });
    }

    const updateOfficerLastShift = async (date: Date) => {
        // Set the loading to true
        setLoading(true);

        // Build the request body
        const requestBody: UpdateOfficerLastShiftBodyType = {
            last_shift: date.toISOString()
        }

        // Make the request
        await make_request(`/officers/${nif}/activity/last-shift`, "PUT", {body: requestBody});

        // Update the last shift date
        await fetchLastShift();

        // Set the loading to false
        setLoading(false);
    }

    const updateOfficerActivity = async () => {
        // Update the last shift date
        await fetchLastShift();

        // Update the last week's hours
        await fetchLastWeekHours();

        // Set the loading to false
        setLoading(false);
    }

    useEffect(() => {
        updateOfficerActivity();
    }, [nif]);

    let content;
    if (loading) {
        content = (
            <>
                {Array.from({length: 6}, (_, index) => {
                    return (
                        <>
                            <Skeleton
                                key={`Skeleton${index}`}
                                variant={"text"}
                                animation={"wave"}
                                width={index % 2 === 0 ? "100%": "30%"}
                            />
                            {index % 2 === 0 ? <Divider flexItem/>: null}
                        </>
                    );
                })}
            </>
        );
    } else {
        content = (
            <>
                <div className={style.officerInfoInnerFieldsetDiv}>
                    <LastShiftPair date={lastShift} onDateChange={updateOfficerLastShift}/>
                    <Divider/>
                    <LastWeekHours id={lastWeekHours?.id!} minutes={lastWeekHours?.minutes!} officer={nif}/>
                </div>
            </>
        );
    }

    return (
        <fieldset>
            <legend>Atividade</legend>
            {content}
        </fieldset>
    );
}