import style from "./patrols.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import ManagementBar from "../../components/ManagementBar";
import {MinifiedPatrolData, PatrolHistoryResponse} from "@portalseguranca/api-types/patrols/output";
import {useEffect, useState} from "react";
import {make_request} from "../../utils/requests.ts";
import {RequestError, SOCKET_EVENT} from "@portalseguranca/api-types";
import {toast} from "react-toastify";
import Gate from "../../components/Gate/gate.tsx";
import {DefaultPagination, DefaultSearch} from "../../components/DefaultComponents";
import PatrolCard from "./components/PatrolCard";
import PatrolInfoModal from "./modals/PatrolInfoModal";
import PatrolCreator from "../../components/PatrolCreator";
import {useForceData, useWebSocketEvent} from "../../hooks";
import {MinifiedOfficerData, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import {getObjectFromId} from "../../forces-data-context.ts";
import {useParams} from "react-router-dom";
import {Loader} from "../../components/Loader";

function Patrols() {
    // Get the patrol id from the URL
    // ! This might not be present
    const {patrolId} = useParams();

    const [currentForceData, getForceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [patrols, setPatrols] = useState<MinifiedPatrolData[]>([]);

    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(10);

    const [selectedPatrol, setSelectedPatrol] = useState<string | null>(null);
    const [patrolInfoModalOpen, setPatrolInfoModalOpen] = useState<boolean>(false);

    // Handle websocket events
    useWebSocketEvent(SOCKET_EVENT.PATROLS, async () => {
        // * Every time a event happens, the page needs to be refreshed
        // Fetch the patrols from the API
        const {patrols, pages} = await fetchPatrols();

        // Set the patrols and set loading to false
        setPatrols(patrols);
        setTotalPages(pages);
    });

    async function fetchPatrols(showLoading?: boolean, filters?: {key: string, value: string}[]): Promise<{ patrols: MinifiedPatrolData[], pages: number }> {
        if (showLoading) {
            setLoading(true);
        }

        let result;

        if (filters) {
            result = await make_request("/patrols", "GET", {queryParams: [{key: "page", value: String(page)}, ...filters]});
        } else {
            result = await make_request("/patrols", "GET", {queryParams: [{key: "page", value: String(page)}]});
        }

        const patrols: PatrolHistoryResponse | RequestError = await result.json();

        if (!result.ok) {
            toast.error(patrols.message);
            return {
                patrols: [],
                pages: 0
            };
        }

        if (showLoading) {
            setLoading(false);
        }

        return {
            patrols: (patrols as PatrolHistoryResponse).data,
            pages: (patrols as PatrolHistoryResponse).meta.pages
        };
    }

    function handleChangeViewedPatrol(id: string) {
        setSelectedPatrol(id);
        setPatrolInfoModalOpen(true);
    }

    // Every time the page changes, fetch the patrols of that page
    useEffect(() => {
        const execute = async () => {
            // Fetch the patrols from the API
            const {patrols, pages} = await fetchPatrols(true);

            // Set the patrols and set loading to false
            setPatrols(patrols);
            setTotalPages(pages);
        }

        execute();
    }, [page]);

    // When the page loads, verify if there's a patrol id in the URL
    useEffect(() => {
        if (patrolId) {
            setSelectedPatrol(patrolId);
            setPatrolInfoModalOpen(true);
        }
    }, [patrolId]);

    return (
        <>
            <ScreenSplit
                leftSideComponent={<PatrolCreator />}
                leftSidePercentage={30}
            >
                <ManagementBar>
                    <div className={style.searchDiv}>
                        <DefaultSearch
                            fullWidth
                            // limitTags={2}
                            callback={async (options) => {
                                const {patrols, pages} = await fetchPatrols(true, options);

                                setPatrols(patrols);
                                setTotalPages(pages);
                            }}
                            options={[
                                {label: "Depois de", key: "after", type: "date"},
                                {label: "Antes de", key: "before", type: "date"},
                                {label: "Em curso", key: "active", type: "boolean"},
                                {label: "Efetivo", key: "officers", type: "asyncOption",
                                    optionsFunc: async (signal) => {
                                        const officers = await make_request("/officers?patrol=true", "GET", {signal: signal});
                                        const officersData: OfficerListResponse | RequestError = await officers.json();

                                        if (!officers.ok) {
                                            toast.error(officersData.message);
                                            return [];
                                        }

                                        return (officersData as OfficerListResponse).data.map((officer: MinifiedOfficerData) => ({
                                            label: `[${officer.callsign}] ${getObjectFromId(officer.patent, getForceData(officer.force!).patents)!.name} ${officer.name}`,
                                            key: String(officer.nif)
                                        }));
                                    }
                                },
                                {label: "Tipo", key: "type", type: "option", options: currentForceData.patrol_types.map(type => ({
                                        label: type.name,
                                        key: String(type.id)
                                    }))
                                },
                                {label: "Unidade Especial", key: "unit", type: "option", options: currentForceData.special_units.map(unit => ({
                                        label: unit.name,
                                        key: String(unit.id)
                                    }))
                                }
                            ]}
                        />
                    </div>

                    <div className={style.paginationDiv}>
                        <DefaultPagination
                            variant={"outlined"}
                            size={"large"}
                            showFirstButton
                            count={totalPages}
                            page={page}
                            onChange={(_e, value) => setPage(value)}
                        />
                    </div>
                </ManagementBar>

                <div className={style.patrolsList}>
                    <Gate show={loading}>
                        <Loader fullDiv />
                    </Gate>

                    <Gate show={!loading}>
                        {patrols.map((patrol) => (
                            <PatrolCard
                                key={`patrol#${patrol.id}`}
                                patrolInfo={patrol}
                                callback={handleChangeViewedPatrol}
                            />
                        ))}
                    </Gate>
                </div>
            </ScreenSplit>

            <PatrolInfoModal open={patrolInfoModalOpen} onClose={() => setPatrolInfoModalOpen(false)} id={selectedPatrol} />
        </>
    )
}

export default Patrols;