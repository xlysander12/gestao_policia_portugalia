import style from "./patrols.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import ManagementBar from "../../components/ManagementBar";
import {MinifiedPatrolData, PatrolHistoryResponse} from "@portalseguranca/api-types/patrols/output";
import {useEffect, useState} from "react";
import {make_request} from "../../utils/requests.ts";
import { RequestError } from "@portalseguranca/api-types/index.ts";
import {toast} from "react-toastify";
import Gate from "../../components/Gate/gate.tsx";
import {DefaultPagination} from "../../components/DefaultComponents";
import PatrolCard from "./components/PatrolCard";
import PatrolInfoModal from "./modals/PatrolInfoModal";
import PatrolCreator from "../../components/PatrolCreator";
import {FullDivLoader} from "../../components/Loader";
import {useWebSocketEvent} from "../../hooks";

function Patrols() {
    const [loading, setLoading] = useState<boolean>(true);
    const [patrols, setPatrols] = useState<MinifiedPatrolData[]>([]);

    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(10);

    const [selectedPatrol, setSelectedPatrol] = useState<string | null>(null);
    const [patrolInfoModalOpen, setPatrolInfoModalOpen] = useState<boolean>(false);

    // Handle websocket events
    useWebSocketEvent("patrols", async () => {
        // * Every time a event happens, the page needs to be refreshed
        // Fetch the patrols from the API
        const {patrols, pages} = await fetchPatrols();

        // Set the patrols and set loading to false
        setPatrols(patrols);
        setTotalPages(pages);
    });

    async function fetchPatrols(showLoading?: boolean): Promise<{ patrols: MinifiedPatrolData[], pages: number }> {
        if (showLoading) {
            setLoading(true);
        }

        // TODO: This has to implement the filters that are going to be used when the search function is done
        const result = await make_request(`/patrols?page=${page}`, "GET");
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

    async function handleChangeViewedPatrol(id: string) {
        setSelectedPatrol(id);
        setPatrolInfoModalOpen(true);
    }

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

    return (
        <>
            <ScreenSplit
                leftSideComponent={<PatrolCreator />}
                leftSidePercentage={30}
            >
                <ManagementBar>
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
                        <FullDivLoader />
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