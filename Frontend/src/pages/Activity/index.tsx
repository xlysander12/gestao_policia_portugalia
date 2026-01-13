import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {OfficerPicker} from "../../components/OfficerPicker";
import {useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import style from "./activity.module.css";
import ManagementBar from "../../components/ManagementBar";
import Gate from "../../components/Gate/gate.tsx";
import {Loader} from "../../components/Loader";
import {
    OfficerActivitySocket,
    OfficerHoursResponse,
    OfficerJustificationsHistoryResponse,
    OfficerMinifiedJustification,
    OfficerSpecificHoursType
} from "@portalseguranca/api-types/officers/activity/output";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import InformationCard from "../../components/InformationCard";
import {Skeleton, Typography} from "@mui/material";
import {getObjectFromId} from "../../forces-data-context.ts";
import {InactivityJustificationModal, WeekHoursRegistryModal} from "./modals";
import {DefaultButton, DefaultTypography} from "../../components/DefaultComponents";
import {useParams} from "react-router-dom";
import moment, {Moment} from "moment"
import {getOfficerFromNif, toHoursAndMinutes} from "../../utils/misc.ts";
import {InactivityTypeData} from "@portalseguranca/api-types/util/output";
import {useForceData, useWebSocketEvent} from "../../hooks";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {SOCKET_EVENT} from "@portalseguranca/api-types";
import {TopHoursModal} from "./modals/TopHoursModal";
import DefaultLink from "../../components/DefaultComponents/DefaultLink.tsx";


type ActivityHoursCardProps = {
    week_start: Moment,
    week_end: Moment,
    minutes: number,
    onClick: (id: number) => void
}
function ActivityHoursCard({week_start, week_end, minutes, onClick}: ActivityHoursCardProps) {
    return (
        <InformationCard
            callback={onClick}
            statusColor={"#3498db"}
        >
            <div>
                <Typography color={"white"} fontSize={"large"} marginBottom={"5px"}>Registo de Horas Semanais</Typography>
                <Typography
                    color={"gray"}
                >
                    Semana:
                    {` ${week_start.format('DD/MM/YYYY')}`}
                    {" > "}
                    {`${week_end.format('DD/MM/YYYY')}`}
                </Typography>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "5px"
                }}>
                    <DefaultTypography color={"gray"}>Horas:</DefaultTypography>
                    <DefaultTypography color={"gray"}>{`${toHoursAndMinutes(minutes)} (${minutes})`}</DefaultTypography>
                </div>

            </div>
        </InformationCard>
    )
}

type ActivityJustificationCardProps = {
    type: number
    start: Moment
    end: Moment | null
    timestamp: Moment
    status: "pending" | "approved" | "denied"
    managed_by: string
    onClick: (id: number) => void
}
function ActivityJustificationCard({type, start, end, status, managed_by, timestamp, onClick}: ActivityJustificationCardProps) {
    // Get the force data from context
    const [forceData] = useForceData();

    // Compute the color of the status bar of the card based on the status of the justification
    const statusColor = status === "pending" ? "#efc032" : status === "approved" ? "#00ff00" : "red";

    return (
        <InformationCard
            statusColor={end && end < moment() ? "gray": statusColor}
            callback={onClick}
        >
            <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
                <div style={{flex: 1}}>
                    <Typography color={"white"} fontSize={"large"} marginBottom={"5px"}>Justificação de
                        Inatividade</Typography>
                    <Typography
                        color={"gray"}>Tipo: {(getObjectFromId(type, forceData.inactivity_types) as InactivityTypeData).name}</Typography>

                    <Gate show={end !== null}>
                        <Typography color={"gray"}>
                            Duração: {`${start.format('DD/MM/YYYY')}`}
                            {` > `}
                            {`${end ? `${end.format('DD/MM/YYYY')}` : ``}`}
                        </Typography>
                    </Gate>

                    <Gate show={end == null}>
                        <Typography color={"gray"}>
                            Duração: A partir de {start.format("DD/MM/YYYY")}
                        </Typography>
                    </Gate>

                </div>

                <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end", flex: 0.5}}>
                    <DefaultTypography
                        color={"gray"}
                        fontSize={"small"}
                    >
                        {moment(timestamp).calendar()}
                    </DefaultTypography>

                    <DefaultTypography
                        color={"gray"}
                        fontSize={"small"}
                        sx={{marginTop: "auto"}}
                    >
                        {managed_by}
                    </DefaultTypography>
                </div>
            </div>
        </InformationCard>
    )
}

type InnerMinifiedOfficerJustification = Omit<OfficerMinifiedJustification, "managed_by"> & {managed_by: string};

function Activity() {
    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Get the force data from context
    const [forceData] = useForceData();

    // Get the officer's nif, entry type and id from the URL params
    // ! This might not be present
    const {nif, type, entry_id} = useParams();

    // Set the loading state
    const [loading, setLoading] = useState<boolean>(true);

    // Set the state for the current viewing officer
    const [currentOfficer, setCurrentOfficer] = useState<MinifiedOfficerData>({
        name: nif && !isNaN(parseInt(nif)) ? "": loggedUser.info.personal.name,
        patent: nif && !isNaN(parseInt(nif)) ? forceData.patents[0].id: loggedUser.info.professional.patent.id,
        callsign: nif && !isNaN(parseInt(nif)) ? "": loggedUser.info.professional.callsign,
        status: nif && !isNaN(parseInt(nif)) ? 0: loggedUser.info.professional.status.id,
        nif: nif && !isNaN(parseInt(nif)) ? parseInt(nif): loggedUser.info.personal.nif
    });

    // Set the states with the history of the officer
    const [officerHistory, setOfficerHistory] = useState<(OfficerSpecificHoursType | InnerMinifiedOfficerJustification)[]>([]);

    // Set the modal opened states
    const [hoursModalOpen, setHoursModalOpen] = useState<boolean>(false);
    const [newHoursModalOpen, setNewHoursModalOpen] = useState<boolean>(false);
    const [justificationModalOpen, setJustificationModalOpen] = useState<boolean>(false);
    const [newJustificationModalOpen, setNewJustificationModalOpen] = useState<boolean>(false);
    const [topHoursModalOpen, setTopHoursModalOpen] = useState<boolean>(false);

    // Set the states for the current working hour and justification
    const [currentHourId, setCurrentHourId] = useState<number>(0);
    const [currentJustificationId, setCurrentJustificationId] = useState<number>(0);

    // Function to fetch the Officer's hours registry
    const fetchHours = async (signal?: AbortSignal) => {
        const response = await make_request(`/officers/${currentOfficer.nif}/activity/hours`, "GET", {signal});
        const responseJson: OfficerHoursResponse = await response.json();
        if (!response.ok) { // Make sure the request was successful
            toast(responseJson.message, {type: "error"});
            return;
        }

        return responseJson.data;
    }

    // Function to fetch the Officer's Justifications
    const fetchJustifications = async (signal?: AbortSignal) => {
        const response = await make_request(`/officers/${currentOfficer.nif}/activity/justifications`, "GET", {signal});
        const responseJson: OfficerJustificationsHistoryResponse = await response.json();
        if (!response.ok) { // Make sure the request was successful
            toast(responseJson.message, {type: "error"});
            return;
        }

        return responseJson.data;
    }

    // Function to sort the history
    const sortHistory = (history: (OfficerSpecificHoursType | InnerMinifiedOfficerJustification)[]) => {
        // * If it's a justification with no end date, it will be placed at the start
        return history.sort((a, b) => {
            if ("end" in a && "end" in b) { // * Both entries are justifications
                if (a.end === null && b.end === null) { // Both justifications don't have an end date
                    if (a.status === "denied" && b.status === "denied") { // If both justifications were denied, sort by start date
                        return b.start - a.start;
                    } else if (a.status === "denied" && b.status !== "denied") { // If A was denied, but B didn't, B goes first
                        return 1;
                    } else if (a.status !== "denied" && b.status === "denied") { // If A wasn't denied, but B did, A goes first
                        return -1;
                    }

                    // Otherwise, sort by start date
                    return b.start - a.start;
                } else if (a.end === null && b.end !== null) { // A doesn't have an end date
                    if (a.status === "denied") { // If A was denied, sort by start date
                        return b.start - a.start;
                    }

                    // Otherwise, A must go last
                    return -1;

                } else if (a.end !== null && b.end === null) { // A has an end date and B doesn't
                    if (b.status === "denied") { // If B was denied, A goes last
                        return -1;
                    }

                    // Otherwise, A goes first
                    return 1;
                } else { // If both have an end date, sort by end date
                    return b.end! - a.end!;
                }
            }

            if ("end" in a && !("end" in b)) { // * A is a justification and B is an hours entry
                if (a.end === null) { // If A doesn't have an end date, it must go last
                    return -1;
                } else { // A has an end date, compare it with the week_end of B
                    return b.week_end - a.end;
                }
            }

            if (!("end" in a) && "end" in b) { // * A is an hours entry and B is a justification
                if (b.end === null) { // If B doesn't have an end date, it must go last
                    return 1;
                } else { // B has an end date, compare it with the week_end of A
                    return b.end - a.week_end;
                }
            }

            // * The remaining case is, both entries are hours entries.
            // In that case, compare the week_end of both entries
            return (b as OfficerSpecificHoursType).week_end - (a as OfficerSpecificHoursType).week_end;
        });
    }

    // Function to fetch the officer's activity
    const fetchActivity = async (signal?: AbortSignal, showLoading: boolean = true, fetchHoursRegistry: boolean = true, fetchJustificationsHistory: boolean = true, clearAll: boolean = false) => {
        // Set the loading state to true
        if (showLoading) {
            setLoading(true);
        }

        // Create a variable to store the officer's data
        let officerData: (OfficerSpecificHoursType | InnerMinifiedOfficerJustification)[] = officerHistory;

        if (clearAll) officerData = [];

        // * If one type of activity is being fetched, we must clear the officer's data relative to that type
        // If we're fetching the hours registry, we must clear all existing hours registry
        if (fetchHoursRegistry && !clearAll) {
            officerData = officerData.filter(entry => !("minutes" in entry));
        }

        // If we're fetching the justifications, we must clear all existing justifications
        if (fetchJustificationsHistory && !clearAll) {
            officerData = officerData.filter(entry => "minutes" in entry);
        }

        // * Fetch the officer's hours
        if (fetchHoursRegistry) {
            officerData.push(...(await fetchHours(signal)) as OfficerSpecificHoursType[]);
        }

        // * Fetch the officer's justifications
        if (fetchJustificationsHistory) {
            const justifications = await fetchJustifications(signal);
            if (!justifications) {
                return;
            }

            // * Make a secondary array with the justifications to change the managed_by value
            const justificationsManagedBy: (Omit<OfficerMinifiedJustification, "managed_by"> & {managed_by: string})[] = [];

            // ? This thing might be a huge performance hit.
            // ? If the officer has a lot of justifications, this will make a lot of requests and the whole page won't load until all of them are done
            for (const justification of justifications) {
                if (justification.status === "pending") {
                    justificationsManagedBy.push({
                        ...justification,
                        managed_by: ""
                    });
                } else {
                    const managedByResponse = await make_request(`/officers/${justification.managed_by!}`, "GET", {signal});
                    const managedByResponseJson: OfficerInfoGetResponse = await managedByResponse.json();

                    if (!managedByResponse.ok) {
                        toast(managedByResponseJson.message, {type: "error"});
                        justificationsManagedBy.push({
                            ...justification,
                            managed_by: `${forceData.patents[0].name} Desconhecido`
                        });

                        continue;
                    }

                    justificationsManagedBy.push({
                        ...justification,
                        managed_by: `${getObjectFromId(managedByResponseJson.data.patent, forceData.patents)?.name} ${managedByResponseJson.data.name}`
                    });
                }
            }

            officerData.push(...justificationsManagedBy);
        }

        // Sort all entries
        officerData = sortHistory(officerData);

        // * Update the state with the officer's data
        setOfficerHistory(officerData);

        // Set the loading state to false
        setLoading(false);
    }

    // Everytime the currentOfficer changes, we will fetch the data from the API
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const execute = async () => {
            // Before doing anything, check if the currentOfficer state is fully built
            let officer;
            if (currentOfficer.name === "") {
                // Since it's not fully built, we must fetch the officer's data from the nif
                try {
                    officer = await getOfficerFromNif(currentOfficer.nif, signal);
                } catch (e) { // If something went wrong, we will set the officer to the logged user, forcing a re-render
                    if (signal.aborted) throw e; // If the error was due to the request being aborted, rethrow it

                    setCurrentOfficer({
                        name: loggedUser.info.personal.name,
                        patent: loggedUser.info.professional.patent.id,
                        callsign: loggedUser.info.professional.callsign,
                        status: loggedUser.info.professional.status.id,
                        nif: loggedUser.info.personal.nif
                    });
                    return;
                }


                // Update the state with the officer's data
                setCurrentOfficer({
                    name: officer.name,
                    patent: officer.patent,
                    callsign: officer.callsign,
                    status: officer.status,
                    nif: officer.nif
                });
            }

            await fetchActivity(signal, true, true, currentOfficer.nif === loggedUser.info.personal.nif || loggedUser.intents.activity, true);
        }

        void execute();

        return () => controller.abort();
    }, [currentOfficer.nif, loggedUser.intents.activity]);

    // Everytime the nif in the params changes, we will update the currentOfficer state
    useEffect(() => {
        if (nif && !isNaN(parseInt(nif))) {
            setCurrentOfficer({
                name: "",
                patent: forceData.patents[0].id,
                callsign: "",
                status: 0,
                nif: parseInt(nif)
            });

            // Check if the provided type is valid
            if (type !== "h" && type !== "j") return

            // Check if the provided entry_id is valid
            if (entry_id && isNaN(parseInt(entry_id))) return

            // Depending on the provided type, open the corresponding modal
            if (type === "h") {
                setCurrentHourId(parseInt(entry_id!));
                setHoursModalOpen(true);
            } else if (type === "j") {
                setCurrentJustificationId(parseInt(entry_id!));
                setJustificationModalOpen(true);
            }
        } else {
            setCurrentOfficer({
                name: loggedUser.info.personal.name,
                patent: loggedUser.info.professional.patent.id,
                callsign: loggedUser.info.professional.callsign,
                status: loggedUser.info.professional.status.id,
                nif: loggedUser.info.personal.nif
            });
        }
    }, [nif, type, entry_id]);

    // Handle socket updates
    useWebSocketEvent<OfficerActivitySocket>(SOCKET_EVENT.ACTIVITY, async (data) => {
        // If another data is being loaded, don't update the data
        if (loading) return;

        // If the update wasn't for the current officer, don't update the data
        if (data.nif !== currentOfficer.nif) return;

        return await fetchActivity(undefined, false, data.type === "hours", data.type === "justification");
    });

    return (
        <>
            <ScreenSplit
                leftSideComponent={
                    <OfficerPicker
                        disabled={loading}
                        callback={setCurrentOfficer}
                        selected={currentOfficer.nif}
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
                        <div className={style.managementBarMainDiv}>
                            <div className={style.managementBarLeftDiv}>
                                <div className={style.managementBarCurrentEditingDiv}>
                                    <Gate show={currentOfficer.name === ""}>
                                        <Skeleton variant={"text"} animation={"wave"} width={"400px"} height={"29px"}/>
                                    </Gate>

                                    <Gate show={currentOfficer.name !== ""}>
                                        <DefaultLink
                                            to={`/efetivos/${currentOfficer.nif}`}
                                            fontSize={"large"}
                                        >
                                            {getObjectFromId(currentOfficer?.patent, forceData.patents)!.name} {currentOfficer?.name}
                                        </DefaultLink>

                                        <DefaultButton
                                            onClick={() => setTopHoursModalOpen(true)}
                                        >
                                            Top Horas
                                        </DefaultButton>
                                    </Gate>
                                </div>
                            </div>

                            <div className={style.managementBarRightDiv}>
                                {/*The option to add an hours entry must only be present if the logged user has the activity intent*/}
                                <Gate show={loggedUser.intents["activity"]}>
                                    <DefaultButton
                                        onClick={() => setNewHoursModalOpen(true)}
                                    >
                                        Novo Registo de Horas
                                    </DefaultButton>
                                </Gate>

                                {/*The option to add a justification entry must only be present if the logged user is the same as the current officer or the logged officer has the activity intent*/}
                                <Gate show={loggedUser.info.personal.nif === currentOfficer.nif || loggedUser.intents["activity"]}>
                                    <DefaultButton
                                        onClick={() => setNewJustificationModalOpen(true)}
                                    >
                                        Nova Justificação
                                    </DefaultButton>
                                </Gate>
                            </div>
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
                                        const entryData = entry;
                                        return (
                                            <ActivityHoursCard
                                                key={`ActivityEntryHours${index}`}
                                                minutes={entryData.minutes}
                                                week_start={moment.unix(entryData.week_start)}
                                                week_end={moment.unix(entryData.week_end)}
                                                onClick={() => {setCurrentHourId(entryData.id); setHoursModalOpen(true)}}
                                            />
                                        )
                                    } else { // If it's not an "hours" entry, it's a "justification" entry
                                        const entryData = entry;
                                        return (
                                            <ActivityJustificationCard
                                                key={`ActivityEntryJustification${index}`}
                                                type={entryData.type}
                                                start={moment.unix(entryData.start)}
                                                end={entryData.end ? moment.unix(entryData.end) : null}
                                                timestamp={moment.unix(entryData.timestamp)}
                                                status={entryData.status}
                                                managed_by={entryData.managed_by}
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
                open={justificationModalOpen || newJustificationModalOpen}
                onClose={() => {
                    setJustificationModalOpen(false);
                    setNewJustificationModalOpen(false);
                }}
                officerNif={currentOfficer.nif}
                justificationId={currentJustificationId}
                newEntry={newJustificationModalOpen}
            />

            <WeekHoursRegistryModal
                open={hoursModalOpen || newHoursModalOpen}
                onClose={() => {
                    setHoursModalOpen(false);
                    setNewHoursModalOpen(false);
                }}
                officer={currentOfficer.nif}
                entryId={currentHourId}
                newEntry={newHoursModalOpen}
            />

            <TopHoursModal
                open={topHoursModalOpen}
                onClose={() => setTopHoursModalOpen(false)}
                week_end={(officerHistory.filter(entry => "week_end" in entry).sort((a, b) => a.week_end > b.week_end ? -1 : 1)[0] ?? {week_end: moment().unix()}).week_end}
            />
        </>
    );
}

export default Activity;