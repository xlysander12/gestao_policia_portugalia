import ManagementBar from "../ManagementBar";
import {
    DefaultButton,
    DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTypography
} from "../DefaultComponents";
import style from "./patrol-creator.module.css";
import {Divider, MenuItem, Skeleton} from "@mui/material";
import {useForceData, useWebSocketEvent} from "../../hooks";
import {PatrolTypeData, SpecialUnitData} from "@portalseguranca/api-types/util/output";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {useImmer} from "use-immer";
import {getObjectFromId} from "../../forces-data-context.ts";
import {useCallback, useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import {CreatePatrolBody, EditPatrolBody} from "@portalseguranca/api-types/patrols/input.ts";
import {toast} from "react-toastify";
import OfficerList from "../OfficerList";
import {BaseResponse, SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types";
import moment, {Moment} from "moment-timezone";
import {ExistingPatrolSocket, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import Gate from "../Gate/gate.tsx";

type InnerPatrolType = {
    id: string
    type: PatrolTypeData
    special_unit: SpecialUnitData
    officers: MinifiedOfficerData[]
    start: Moment
    notes: string | null
    force: string
}

function PatrolQuickCreator() {
    // Get the force data from hook
    const [forceData, getForceData] = useForceData();

    // Get the logged officer from context
    const loggedUser = useContext(LoggedUserContext);

    // Creating the default patrol var
    const DEFAULT_PATROL: InnerPatrolType = {
        id: "-1",
        type: forceData.patrol_types[0],
        special_unit: forceData.special_units[0],
        officers: [{
            name: loggedUser.info.personal.name,
            patent: loggedUser.info.professional.patent.id,
            callsign: loggedUser.info.professional.callsign,
            status: loggedUser.info.professional.status.id,
            nif: loggedUser.info.personal.nif,
            force: localStorage.getItem("force")!
        }],
        start: moment(null),
        notes: null,
        force: localStorage.getItem("force")!
    };

    // Loading state
    const [loading, setLoading] = useState<boolean>(false);

    // State that holds the patrol information
    const [patrolData, setPatrolData] = useImmer<InnerPatrolType>(DEFAULT_PATROL);
    const [firstRender, setFirstRender] = useState<boolean>(true);
    const [patrolDuration, setPatrolDuration] = useState<number>(0);

    async function fetchCurrentPatrol(showLoading = true, signal?: AbortSignal) {
        // Set the loading to true
        if (showLoading)
            setLoading(true);

        // Query the server and fetch the officer's current patrol
        const response = await make_request(`/officers/${loggedUser.info.personal.nif}/patrol`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as PatrolInfoResponse;

        // If no patrol was found, let the values be the default ones
        if (response.status === 404) {
            setPatrolData(DEFAULT_PATROL);
            setLoading(false);
            return;
        }

        // Parse the force of the patrol from the id
        const patrolForce = responseJson.data.id.match(/([a-z]+)(\d+)$/)![1];

        // * Get the information of all officers in the patrol
        const officers: MinifiedOfficerData[] = await Promise.all(responseJson.data.officers.map(async officerNif => {
            // Return the logged officer from context
            if (officerNif === loggedUser.info.personal.nif) {
                return {
                    name: loggedUser.info.personal.name,
                    patent: loggedUser.info.professional.patent.id,
                    callsign: loggedUser.info.professional.callsign,
                    status: loggedUser.info.professional.status.id,
                    nif: loggedUser.info.personal.nif,
                    force: localStorage.getItem("force")!
                }
            }

            const officerResponse = await make_request(`/officers/${officerNif}?patrol=true`, RequestMethod.GET);
            const officerResponseJson = await officerResponse.json() as OfficerInfoGetResponse;

            if (!officerResponse.ok) {
                console.error("Patrulha com efetivo desconhecido");
                return {
                    name: "Efetivo desconhecido",
                    patent: forceData.patents[0].id,
                    callsign: "N/A",
                    status: forceData.statuses[0].id,
                    nif: officerNif,
                    force: localStorage.getItem("force")!
                };
            }

            return {
                name: officerResponseJson.data.name,
                patent: officerResponseJson.data.patent,
                callsign: officerResponseJson.data.callsign,
                status: officerResponseJson.data.status,
                nif: officerResponseJson.data.nif,
                force: officerResponseJson.data.force,
            }
        }));

        // If a patrol was found, update the state
        setPatrolData({
            id: responseJson.data.id,
            type: getObjectFromId(responseJson.data.type, getForceData(patrolForce).patrol_types)!,
            special_unit: responseJson.data.unit ? getObjectFromId(responseJson.data.unit, getForceData(patrolForce).special_units)! : getForceData(patrolForce).special_units[0],
            officers: officers,
            start: moment.unix(responseJson.data.start),
            notes: responseJson.data.notes,
            force: patrolForce
        });

        setLoading(false);
    }

    async function startPatrol() {
        // Set the loading state to true
        setLoading(true);

        const response = await make_request<CreatePatrolBody>("/patrols", RequestMethod.POST, {
            body: {
                type: patrolData.type.id,
                special_unit: patrolData.type.isSpecial ? patrolData.special_unit.id: undefined,
                officers: patrolData.officers.map((officer) => officer.nif),
                start: moment.tz(moment(), "Europe/Lisbon").unix(),
                notes: patrolData.notes ? patrolData.notes: undefined
            }
        });

        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            await fetchCurrentPatrol();
            return;
        }
        toast.success("Patrulha iniciada!");

        // Update the component
        await fetchCurrentPatrol();
    }

    async function updatePatrol() {
        setLoading(true);

        const response = await make_request<EditPatrolBody>(`/patrols/${patrolData.id}`, RequestMethod.PATCH, {
            body: {
                officers: patrolData.officers.map((officer) => officer.nif),
                notes: patrolData.notes ?? undefined,
            }
        });
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            await fetchCurrentPatrol();
            return;
        }

        // Update the component
        await fetchCurrentPatrol();
    }

    async function endPatrol() {
        // Set the loading state to true
        setLoading(true);

        const response = await make_request<EditPatrolBody>(`/patrols/${patrolData.id}`, RequestMethod.PATCH, {
            body: {
                end: moment().unix(),
            }
        });
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            await fetchCurrentPatrol();
            return;
        }
        toast.success("Patrulha terminada!");

        // Update the component
        await fetchCurrentPatrol();
    }

    // Everytime an update to a patrol happens, refresh this component
    useWebSocketEvent<SocketResponse>(SOCKET_EVENT.PATROLS, useCallback((data) => {
        // If the event was triggered by the logged user disregard it
        if (data.by === loggedUser.info.personal.nif) return;

        // If there isn't a patrol stored and the event is an "add" event, refresh the component
        if (patrolData.id === "-1" && (data.action === "add" || data.action === "update")) {
            void fetchCurrentPatrol(false);
            return;
        }

        // If the event wasn't about the current patrol, disregard it
        if (`${(data as ExistingPatrolSocket).force}${(data as ExistingPatrolSocket).id}` !== patrolData.id) return;

        // Refresh the component
        void fetchCurrentPatrol(false);
    }, [patrolData.id, loggedUser.info.personal.nif]));

    // Load the current officer's patrol when the component mounts
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (firstRender) {
            void fetchCurrentPatrol(true, signal);
        }

        return () => {
            controller.abort();
        }
    }, []);

    // Every time the notes or the officers change, wait 2 seconds and, if no more changes were made, update the patrol
    useEffect(() => {
        // Ignore if no patrol is started
        if (patrolData.id === "-1") return;

        // Ignore if it's the first render
        if (firstRender) {
            setFirstRender(false);
            return;
        }

        const timeout = setTimeout(updatePatrol, 2000);

        return () => {
            // If another change was detected, clear the timeout and start again
            clearTimeout(timeout);
        }
    }, [patrolData.id, patrolData.notes?.trim(), JSON.stringify(patrolData.officers.map(officer => officer.nif))]);

    // Create a loop to keep counting the elapsed time of the patrol
    useEffect(() => {
        // If there's no patrol active, no need to create the loop
        if (patrolData.id === "-1") return;

        // Create the loop the state with the duration
        const loop = setInterval(() => {
            setPatrolDuration(moment().diff(patrolData.start));
        }, 500);

        return () => {
            setPatrolDuration(0);
            clearInterval(loop);
        }
    }, [patrolData.id, patrolData.start.unix()]);

    return (
        <>
            <ManagementBar>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Gate show={loading && patrolData.id === "-1"}>
                        <Skeleton variant={"text"} width={"200px"}/>
                        <Skeleton variant={"text"} width={"200px"}/>
                    </Gate>

                    <Gate show={!loading || patrolData.id !== "-1"}>
                        <Gate show={patrolData.id === "-1"}>
                            <DefaultTypography>00:00:00</DefaultTypography>
                        </Gate>
                        <Gate show={patrolData.id !== "-1"}>
                            <DefaultTypography>{moment.duration(patrolDuration).format("hh:mm:ss", {trim: false})}</DefaultTypography>
                        </Gate>

                        <DefaultTypography color={patrolData.id === "-1" ? "lightgreen": "lightblue"}>{patrolData.id === "-1" ? "Disponível" : "Em Patrulha"}</DefaultTypography>
                    </Gate>
                </div>

                <Gate show={patrolData.id === "-1"}>
                    <DefaultButton
                        disabled={loading}
                        buttonColor={"lightgreen"}
                        darkTextOnHover
                        onClick={startPatrol}
                    >
                        Iniciar
                    </DefaultButton>
                </Gate>

                <Gate show={patrolData.id !== "-1"}>
                    <DefaultButton
                        disabled={loading}
                        buttonColor={"red"}
                        onClick={endPatrol}
                    >
                        Terminar
                    </DefaultButton>
                </Gate>
            </ManagementBar>

            <div className={style.informationsDiv}>
                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo de Patrulha:</DefaultTypography>
                <Gate show={patrolData.id === "-1"}>
                    <DefaultSelect
                        fullWidth
                        disabled={loading || patrolData.id !== "-1"}
                        value={patrolData.type.id}
                        onChange={(event) => {
                            setPatrolData((draft) => {
                                draft.type = getObjectFromId(event.target.value as number, forceData.patrol_types)!;
                            });
                        }}
                    >
                        {forceData.patrol_types.map((patrolType) => {
                            return (
                                <MenuItem
                                    key={`patrolType#${patrolType.id}`}
                                    value={patrolType.id}>{patrolType.name}
                                </MenuItem>
                            );
                        })}
                    </DefaultSelect>
                </Gate>

                <Gate show={patrolData.id !== "-1"}>
                    <DefaultTypography>
                        {patrolData.type.name}
                    </DefaultTypography>
                </Gate>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade Especial:</DefaultTypography>
                <Gate show={patrolData.id === "-1"}>
                    <DefaultSelect
                        fullWidth
                        disabled={!patrolData.type.isSpecial || loading}
                        value={patrolData.special_unit?.id ?? forceData.special_units[0].id}
                        onChange={(event) => {
                            setPatrolData((draft) => {
                                draft.special_unit = getObjectFromId(event.target.value as number, forceData.special_units)!;
                            });
                        }}
                    >
                        {forceData.special_units.map((unit) => {
                            return (
                                <MenuItem
                                    key={`specialUnit#${unit.id}`}
                                    value={unit.id}>{unit.name}
                                </MenuItem>
                            );
                        })}
                    </DefaultSelect>
                </Gate>

                <Gate show={patrolData.id !== "-1"}>
                    <DefaultTypography  color={!patrolData.type.isSpecial ? "rgba(208,199,211,0.5)" : undefined}>
                        {patrolData.special_unit?.name ?? getForceData(patrolData.force).special_units[0].name}
                    </DefaultTypography>
                </Gate>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Observações:</DefaultTypography>
                <DefaultOutlinedTextField
                    disabled={loading}
                    multiline
                    fullWidth
                    value={patrolData.notes ? patrolData.notes : ""}
                    onChange={(event) => {
                        setPatrolData((draft) => {
                            draft.notes = event.target.value.trim() !== "" ? event.target.value : null;
                        });
                    }}
                />

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Membros:</DefaultTypography>

                <OfficerList
                    disabled={loading}
                    startingOfficers={patrolData.officers}
                    changeCallback={(officers) => {
                        setPatrolData((draft) => {
                            draft.officers = officers
                        });
                    }}
                />
            </div>
    </>
);
}

export default PatrolQuickCreator;