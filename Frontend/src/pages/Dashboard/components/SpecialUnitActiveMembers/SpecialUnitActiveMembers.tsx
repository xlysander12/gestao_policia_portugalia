import ManagementBar from "../../../../components/ManagementBar";
import {DefaultSelect, DefaultTypography} from "../../../../components/DefaultComponents";
import {useForceData, useWebSocketEvent} from "../../../../hooks";
import {Divider, MenuItem} from "@mui/material";
import {useCallback, useContext, useEffect, useState} from "react";
import {SpecialUnitData, UtilSpecialUnitsActiveResponse} from "@portalseguranca/api-types/util/output";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import OfficerList from "../../../../components/OfficerList";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import {SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types";
import {MinifiedPatrolData, PatrolHistoryResponse} from "@portalseguranca/api-types/patrols/output";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {BASE_URL} from "../../../../utils/constants.ts";

type InnerMinifiedPatrolData = Omit<MinifiedPatrolData, "officers"> & {
    officers: MinifiedOfficerData[]
}

function SpecialUnitActiveMembers() {
    const [forceData] = useForceData();

    const loggedUser = useContext(LoggedUserContext);

    const [loading, setLoading] = useState<boolean>(false);

    const [selected, setSelected] = useState<SpecialUnitData>(forceData.special_units[0] ?? undefined);
    const [active, setActive] = useState<MinifiedOfficerData[]>([]);
    const [unitPatrols, setUnitPatrols] = useState<InnerMinifiedPatrolData[]>([]);

    async function fetchActiveMembers(showLoading = true, signal?: AbortSignal) {
        if (showLoading)
            setLoading(true);

        // * Check active members
        const response = await make_request(`/util/special-units/${selected.id}/active`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as UtilSpecialUnitsActiveResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setActive([]);
            setLoading(false);
            return;
        }

        setActive(responseJson.data);

        // * Check unit active patrols
        const patrolsResponse = await make_request(`/patrols?active=true&unit=${selected.id}`, RequestMethod.GET, {signal});
        const patrolsJson: PatrolHistoryResponse = await patrolsResponse.json();

        if (!response.ok) {
            toast.error(patrolsJson.message);
            setUnitPatrols([]);
            setLoading(false);
            return;
        }

        setUnitPatrols(await Promise.all(patrolsJson.data.map(async patrol => {
            return {
                ...patrol,
                officers: await Promise.all(patrol.officers.map(async officerNif => {
                    // * Get Officer's info
                    // If the officer is the logged user, load data from context
                    if (officerNif === loggedUser.info.personal.nif) {
                        return {
                            name: loggedUser.info.personal.name,
                            patent: loggedUser.info.professional.patent.id,
                            callsign: loggedUser.info.professional.callsign,
                            status: loggedUser.info.professional.status.id,
                            nif: officerNif,
                            force: localStorage.getItem("force")!
                        }
                    }

                    const response = await make_request(`/officers/${officerNif}`, RequestMethod.GET, {signal});
                    const responseJson: OfficerInfoGetResponse = await response.json();

                    if (!response.ok) {
                        return {
                            name: "Efetivo Desconhecido",
                            patent: forceData.patents[0].id,
                            callsign: "N/A",
                            status: forceData.statuses[0].id,
                            nif: officerNif,
                            force: localStorage.getItem("force")!
                        }
                    }

                    return responseJson.data;
                }))
            }
        })));

        setLoading(false);
    }

    useWebSocketEvent<SocketResponse>(SOCKET_EVENT.PATROLS, useCallback(() => void fetchActiveMembers(false), [selected.id]));

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        void fetchActiveMembers(true, signal);

        return () => controller.abort();
    }, [selected.id]);

    return (
        <>
            <ManagementBar>
                <div
                    style={{
                        width: "100%"
                    }}
                >
                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade Especial:</DefaultTypography>
                    <DefaultSelect
                        fullWidth
                        value={selected.id}
                        onChange={(event) =>
                            setSelected(forceData.special_units.find(unit => unit.id === event.target.value as number)!)}
                    >
                        {forceData.special_units.map(unit => {
                            return (
                                <MenuItem key={`specialunit#${unit.id}`} value={unit.id}>{unit.name}</MenuItem>
                            );
                        })}
                    </DefaultSelect>
                </div>
            </ManagementBar>

            <div
                style={{
                    boxSizing: "border-box",
                    backgroundColor: "var(--portalseguranca-color-background-dark)",
                    height: "calc(100% - (5.4rem + 10px))",
                    marginTop: "10px",
                    padding: "0.7rem",
                }}
            >


                <Gate show={loading}>
                    <Loader fullDiv />
                </Gate>

                <Gate show={!loading}>
                    {/*Available Officers - The ones that are in a patrol, but not of this unit*/}
                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Membros Disponíveis:</DefaultTypography>
                    <Gate show={active.length > 0}>
                        <OfficerList
                            disabled
                            invisibleDisabled
                            startingOfficers={active.filter(officer =>  // Remove all officers that are in a patrol of this unit
                                !unitPatrols.flatMap(patrol => patrol.officers) // Make an array that's a combination of all officers in all patrols
                                    .map(officerData => officerData.nif) // Make an array that only contains the Nifs of the officers
                                    .includes(officer.nif) // Compare the nifs
                                )}
                            changeCallback={() => {}}
                        />
                    </Gate>
                    <Gate
                        show={active.filter(officer =>  // Remove all officers that are in a patrol of this unit
                                    !unitPatrols.flatMap(patrol => patrol.officers) // Make an array that's a combination of all officers in all patrols
                                        .map(officerData => officerData.nif) // Make an array that only contains the Nifs of the officers
                                        .includes(officer.nif) // Compare the nifs
                                    ).length === 0}>
                        <div
                            style={{
                                textAlign: "center"
                            }}
                        >
                            <DefaultTypography fontSize={"larger"}>Sem Resultados</DefaultTypography>
                        </div>
                    </Gate>

                    {/*In Patrol Officers - The ones that are currently in a patrol of the unit*/}
                    <Gate show={unitPatrols.length > 0}> {/*Show a divider if there are patrols*/}
                        <Divider />
                    </Gate>
                    {unitPatrols.map((patrol, index) => (
                        <>
                            <DefaultTypography
                                color={"var(--portalseguranca-color-accent)"}
                                fontWeight={"bold"}
                                clickable
                                onClick={() => window.open(`${BASE_URL}/patrulhas/${patrol.id}`)}
                            >
                                Unidade em Patrulha (#{patrol.id.toUpperCase()}):
                            </DefaultTypography>
                            <OfficerList
                                disabled
                                invisibleDisabled
                                startingOfficers={patrol.officers}
                                changeCallback={() => {}}
                            />

                            <Gate show={index < unitPatrols.length - 1}>
                                <Divider />
                            </Gate>
                        </>
                    ))}
                </Gate>
            </div>
        </>
    );
}

export default SpecialUnitActiveMembers;