import style from "./patrols.module.css";
import ScreenSplit, {LoadingHalfScreen} from "../../components/ScreenSplit/screen-split.tsx";
import ManagementBar from "../../components/ManagementBar";
import {MinifiedPatrolData, PatrolHistoryResponse} from "@portalseguranca/api-types/patrols/output";
import {useEffect, useState} from "react";
import {make_request} from "../../utils/requests.ts";
import { RequestError } from "@portalseguranca/api-types/index.ts";
import {toast} from "react-toastify";
import Gate from "../../components/Gate/gate.tsx";
import {DefaultPagination} from "../../components/DefaultComponents";
import PatrolCard from "./components/PatrolCard";

function Patrols() {
    const [loading, setLoadig] = useState<boolean>(true);
    const [patrols, setPatrols] = useState<MinifiedPatrolData[]>([]);

    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(10);

    async function fetchPatrols(): Promise<{ patrols: MinifiedPatrolData[], pages: number }> {
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

        return {
            patrols: (patrols as PatrolHistoryResponse).data,
            pages: (patrols as PatrolHistoryResponse).meta.pages
        };
    }

    async function handleChangeViewedPatrol(id: string) {
        console.log(id);

    }

    useEffect(() => {
        const execute = async () => {
            // Set loading to true
            setLoadig(true);

            // Fetch the patrols from the API
            const patrols = await fetchPatrols();

            // Set the patrols and set loading to false
            setPatrols(patrols.patrols);
            setTotalPages(patrols.pages);
            setLoadig(false);
        }

        execute();
    }, [page]);

    return (
        <>
            <ScreenSplit leftSideComponent={<></>} leftSidePercentage={30}>
                <div
                    style={{
                        height: "100%",
                        width: "100%"
                    }}
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
                            <LoadingHalfScreen />
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
                </div>
            </ScreenSplit>
        </>
    )
}

export default Patrols;