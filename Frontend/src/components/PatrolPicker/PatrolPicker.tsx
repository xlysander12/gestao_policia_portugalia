import ManagementBar from "../ManagementBar";
import style from "../../pages/Patrols/patrols.module.css";
import {DefaultPagination, DefaultSearch, DefaultTypography} from "../DefaultComponents";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import {getObjectFromId} from "../../forces-data-context.ts";
import Gate from "../Gate/gate.tsx";
import {Loader} from "../Loader";
import PatrolCard from "./PatrolCard";
import {useEffect, useState} from "react";
import { MinifiedPatrolData, PatrolHistoryResponse } from "@portalseguranca/api-types/patrols/output";
import { RequestError, SOCKET_EVENT } from "@portalseguranca/api-types";
import {MinifiedOfficerData, OfficerListResponse } from "@portalseguranca/api-types/officers/output";
import {useForceData, useWebSocketEvent} from "../../hooks";

export type PatrolPickerProps = {
    callback: (patrol: MinifiedPatrolData) => void
    filters?: {key: string, value: string}[]
}
function PatrolPicker(props: PatrolPickerProps) {

    const [currentForceData, getForceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);
    const [patrols, setPatrols] = useState<MinifiedPatrolData[]>([]);

    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(10);

    // Handle websocket events
    useWebSocketEvent(SOCKET_EVENT.PATROLS, async () => {
        // * Every time a event happens, the page needs to be refreshed
        // Fetch the patrols from the API
        const {patrols, pages} = await fetchPatrols();

        // Set the patrols and set loading to false
        setPatrols(patrols);
        setTotalPages(pages);
    });

    // Every time the page changes, fetch the patrols of that page
    useEffect(() => {
        const execute = async () => {
            // Fetch the patrols from the API
            const {patrols, pages} = await fetchPatrols(true);

            // Set the patrols and set loading to false
            setPatrols(patrols);
            setTotalPages(pages);
        }

        void execute();
    }, [page]);

    async function fetchPatrols(showLoading?: boolean, filters?: {key: string, value: string}[]): Promise<{ patrols: MinifiedPatrolData[], pages: number }> {
        if (showLoading) {
            setLoading(true);
        }

        let result;

        // If there were filters passed to the props of the component, ensure they are in the object
        if (props.filters) {
            if (!filters) {
                filters = props.filters;
            } else {
                filters = {...filters, ...props.filters};
            }
        }

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

    return (
        <>
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
                            callback={props.callback}
                        />
                    ))}
                </Gate>

                <Gate show={!loading && patrols.length === 0}>
                    <DefaultTypography
                        color={"var(--portalseguranca-color-text-dark)"}
                        fontSize={"xx-large"}
                        sx={{alignSelf: "center"}}
                    >
                        Sem Registos
                    </DefaultTypography>
                </Gate>
            </div>
        </>
    );
}

export default PatrolPicker;