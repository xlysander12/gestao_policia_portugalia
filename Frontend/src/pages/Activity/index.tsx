import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import OfficerList from "../../components/OfficerList/officer-list.tsx";
import {useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import style from "./activity.module.css";
import ManagementBar from "../../components/ManagementBar";
import Gate from "../../components/Gate/gate.tsx";
import Loader from "../../components/Loader/loader.tsx";
import {
    OfficerHoursResponse, OfficerJustificationsHistoryResponse,
    OfficerMinifiedJustification,
    OfficerSpecificHoursType
} from "@portalseguranca/api-types/officers/activity/output";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import InformationCard from "../../components/InformationCard";
import {Skeleton, Typography} from "@mui/material";
import {ForceDataContext, getObjectFromId, InactivityType} from "../../force-data-context.ts";
import {InactivityJustificationModal, WeekHoursRegistryModal} from "./modals";

function toHoursAndMinutes(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}`;
}
function padToTwoDigits(num: number) {
    return num.toString().padStart(2, "0");
}


type ActivityHoursCardProps = {
    week_start: Date,
    week_end: Date,
    minutes: number,
    onClick: (id: number) => void
}
function ActivityHoursCard({week_start, week_end, minutes, onClick}: ActivityHoursCardProps) {
    return (
        <InformationCard
            callback={onClick}
            statusColor={minutes >= 500 ? "rgb(0, 255, 0)": "red"}
        >
            <div>
                <Typography color={"white"} fontSize={"large"} marginBottom={"5px"}>Registo de Horas Semanais</Typography>
                <Typography
                    color={"gray"}
                >
                    Semana:
                    {` ${padToTwoDigits(week_start.getDate())}/${padToTwoDigits(week_start.getMonth() + 1)}/${week_start.getFullYear()}`}
                    {" > "}
                    {`${padToTwoDigits(week_end.getDate())}/${padToTwoDigits(week_end.getMonth() + 1)}/${week_end.getFullYear()}`}
                </Typography>
                <Typography color={"gray"}>Horas: {`${toHoursAndMinutes(minutes)} (${minutes})`}</Typography>
            </div>
        </InformationCard>
    )
}

type ActivityJustificationCardProps = {
    type: number,
    start: Date,
    end: Date | null,
    status: "pending" | "approved" | "denied",
    onClick: (id: number) => void
}
function ActivityJustificationCard({type, start, end, status, onClick}: ActivityJustificationCardProps) {
    // Get the force data from context
    const forceData = useContext(ForceDataContext);

    // Compute the color of the status bar of the card based on the status of the justification
    const statusColor = status === "pending" ? "#efc032" : status === "approved" ? "green" : "darkred";

    return (
        <InformationCard
            statusColor={statusColor}
            callback={onClick}
        >
            <div>
                <Typography color={"white"} fontSize={"large"} marginBottom={"5px"}>Justificação de Inatividade</Typography>
                <Typography color={"gray"}>Tipo: {(getObjectFromId(type, forceData.inactivity_types) as InactivityType).name}</Typography>

                <Gate show={end !== null}>
                    <Typography color={"gray"}>
                        Duração: {`${padToTwoDigits(start.getDate())}/${padToTwoDigits(start.getMonth() + 1)}/${start.getFullYear()}`}
                        {` > `}
                        {`${end ? `${padToTwoDigits(end!.getDate())}/${padToTwoDigits(end!.getMonth() + 1)}/${end!.getFullYear()}`: ``}`}
                    </Typography>
                </Gate>

                <Gate show={end == null}>
                    <Typography color={"gray"}>
                        Duração: A partir de {" "}
                        {`${padToTwoDigits(start.getDate())}/${padToTwoDigits(start.getMonth() + 1)}/${start.getFullYear()}`}
                    </Typography>
                </Gate>

            </div>
        </InformationCard>
    )
}

function Activity() {
    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Get the force data from context
    const forceData = useContext(ForceDataContext);

    // Set the loading state
    const [loading, setLoading] = useState<boolean>(true);

    // Set the state for the current viewing officer
    const [currentOfficer, setCurrentOfficer] = useState<number>(loggedUser.info.personal.nif);

    // Set the state for the current viewing officer's patent and name
    const [currentOfficerPatentAndName, setCurrentOfficerPatentAndName] = useState<{patent: string, name: string}>();

    // Set the states with the history of the officer
    const [officerHistory, setOfficerHistory] = useState<(OfficerSpecificHoursType | OfficerMinifiedJustification)[]>([]);

    // Set the modal opened states
    const [hoursModalOpen, setHoursModalOpen] = useState<boolean>(false);
    const [justificationModalOpen, setJustificationModalOpen] = useState<boolean>(false);

    // Set the states for the current working hour and justification
    const [currentHourId, setCurrentHourId] = useState<number>(0);
    const [currentJustificationId, setCurrentJustificationId] = useState<number>(0);


    // Everytime the currentOfficer changes, we will fetch the data from the API
    useEffect(() => {
        const execute = async () => {
            // Set the loading state to true
            setLoading(true);

            // Create a variable to store the officer's data
            let officerData: (OfficerSpecificHoursType | OfficerMinifiedJustification)[] = [];

            // * Fetch the officer's hours
            const hoursResponse = await make_request(`/officers/${currentOfficer}/activity/hours`, "GET");
            const hoursResponseData: OfficerHoursResponse = await hoursResponse.json();
            if (!hoursResponse.ok) { // Make sure the request was successful
                toast(hoursResponseData.message, {type: "error"});
            }

            officerData.push(...hoursResponseData.data);

            // * Fetch the officer's justifications
            const justificationsResponse = await make_request(`/officers/${currentOfficer}/activity/justifications`, "GET");
            const justificationsResponseData: OfficerJustificationsHistoryResponse = await justificationsResponse.json();
            if (!justificationsResponse.ok) { // Make sure the request was successful
                toast(justificationsResponseData.message, {type: "error"});
            }

            officerData.push(...justificationsResponseData.data);

            // * Update the state with the officer's data
            setOfficerHistory(officerData);

            // Sort all entries by end date from the most recent to the most old
            // If it's a justification with no end date, it will be placed at the start
            officerData.sort((a, b) => {
                if ("end" in a && "end" in b) { // Both entries are justifications
                    if (a.end === null && b.end === null) { // If both justifications don't have an end date, sort by start date
                        return Date.parse(b.start) - Date.parse(a.start);
                    } else if (a.end === null && b.end !== null) { // If A doesn't have an end date and B does, A must go last
                        return -1;
                    } else if (a.end !== null && b.end === null) { // If A has an end date and B doesn't, B must go last
                        return 1;
                    } else { // If both have an end date, sort by end date
                        return Date.parse(b.end!) - Date.parse(a.end!);
                    }
                }

                if ("end" in a && !("end" in b)) { // A is a justification and B is an hours entry
                    if (a.end === null) { // If A doesn't have an end date, it must go last
                        return -1;
                    } else { // A has an end date, compare it with the week_end of B
                        return Date.parse(b.week_end) - Date.parse(a.end!);
                    }
                }

                if (!("end" in a) && "end" in b) { // A is an hours entry and B is a justification
                    if (b.end === null) { // If B doesn't have an end date, it must go last
                        return 1;
                    } else { // B has an end date, compare it with the week_end of A
                        return Date.parse(b.end!) - Date.parse(a.week_end);
                    }
                }

                // The remaining case is, both entries are hours entries.
                // In that case, compare the week_end of both entries
                return Date.parse((b as OfficerSpecificHoursType).week_end) - Date.parse((a as OfficerSpecificHoursType).week_end);
            });

            // Fetch the officer's patent and name
            const officerDataResponse = await make_request(`/officers/${currentOfficer}`, "GET");
            const officerDataResponseData = await officerDataResponse.json();
            if (!officerDataResponse.ok) {
                toast(officerDataResponseData.message, {type: "error"});
            }

            setCurrentOfficerPatentAndName({
                patent: getObjectFromId(officerDataResponseData.data.patent, forceData.patents).name,
                name: officerDataResponseData.data.name
            });

            // Set the loading state to false
            setLoading(false);
        }

        execute();
    }, [currentOfficer]);

    return (
        <>
            <ScreenSplit
                leftSideComponent={
                    <OfficerList
                        disabled={!loggedUser.intents["activity"]}
                        callbackFunction={setCurrentOfficer}
                    />
                }

                leftSidePercentage={30}
            >
                <div
                    style={{
                        height: "100%",
                        width: "100%"
                    }}
                >
                    <ManagementBar>
                        <div style={{display: "flex", flexDirection: "row", gap: "5px"}}>
                            <Typography color={"white"} fontSize={"larger"}>Atividade de</Typography>
                            <Gate show={loading}>
                                <Skeleton variant={"text"} animation={"wave"} width={"400px"} height={"29px"}/>
                            </Gate>

                            <Gate show={!loading}>
                                <Typography color={"white"} fontSize={"larger"}>{currentOfficerPatentAndName?.patent} {currentOfficerPatentAndName?.name}</Typography>
                            </Gate>
                        </div>
                    </ManagementBar>

                    <div className={style.entriesList}>
                        <Gate show={loading}>
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                height: "100%"
                            }}>
                                <Loader/>
                            </div>
                        </Gate>

                        <Gate show={!loading}>
                            <Gate show={officerHistory.length === 0}>
                                <Typography color={"var(--portalseguranca-color-text-dark)"} fontSize={"xx-large"} sx={{alignSelf: "center"}}>Sem Registos</Typography>
                            </Gate>

                            <Gate show={officerHistory.length > 0}>
                                {officerHistory.map((entry, index) => {
                                    if ("minutes" in entry) { // This means it's an "hours" entry
                                        const entryData = entry as OfficerSpecificHoursType;
                                        return (
                                            <ActivityHoursCard
                                                key={`ActivityEntryHours${index}`}
                                                minutes={entryData.minutes}
                                                week_start={new Date(Date.parse(entryData.week_start))}
                                                week_end={new Date(Date.parse(entryData.week_end))}
                                                onClick={() => {setCurrentHourId(entryData.id); setHoursModalOpen(true)}}
                                            />
                                        )
                                    } else { // If it's not an "hours" entry, it's a "justification" entry
                                        const entryData = entry as OfficerMinifiedJustification;
                                        return (
                                            <ActivityJustificationCard
                                                key={`ActivityEntryJustification${index}`}
                                                type={entryData.type}
                                                start={new Date(Date.parse(entryData.start))}
                                                end={entryData.end ? new Date(Date.parse(entryData.end)) : null}
                                                status={entryData.status}
                                                onClick={() => {setCurrentJustificationId(entryData.id); setJustificationModalOpen(true)}}
                                            />
                                        )
                                    }
                                })}
                            </Gate>
                        </Gate>
                    </div>
                </div>
            </ScreenSplit>

            <InactivityJustificationModal
                open={justificationModalOpen}
                onClose={() => setJustificationModalOpen(false)}
                officerNif={currentOfficer}
                justificationId={currentJustificationId}
            />

            <WeekHoursRegistryModal
                open={hoursModalOpen}
                onClose={() => setHoursModalOpen(false)}
                officer={currentOfficer}
                entryId={currentHourId}
            />
        </>
    );
}

export default Activity;