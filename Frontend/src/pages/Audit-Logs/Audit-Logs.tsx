import {useCallback, useEffect, useMemo, useState} from "react";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {Filter} from "./components/index.ts";
import ManagementBar from "../../components/ManagementBar";
import {DefaultPagination, DefaultTypography} from "../../components/DefaultComponents";
import styles from "./styles.module.css";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import {useParams, useSearchParams} from "react-router-dom";
import {AuditLogHistoryResponse, MinifiedAuditLogData} from "@portalseguranca/api-types/audit-logs/output";
import { toast } from "react-toastify";
import moment, {Moment} from "moment";
import AuditLogEntryCard from "./components/Card/AuditLogEntryCard.tsx";
import Gate from "../../components/Gate/gate.tsx";
import {Loader} from "../../components/Loader";
import {useWebSocketEvent} from "../../hooks";
import {AuditLogModal} from "./modals";

export interface InnerMinifiedAuditLogData extends Omit<MinifiedAuditLogData, "timestamp"> {
    timestamp: Moment
}

function AuditLogs() {
    const {id} = useParams();

    const [searchParams] = useSearchParams();

    const [page, setPage] = useState<number>(1);
    const [maxPages, setMaxPages] = useState<number>(1);

    const [history, setHistory] = useState<InnerMinifiedAuditLogData[]>([]);

    const [loading, setLoading] = useState<boolean>(false);

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedEntryId, setselectedEntryId] = useState<number | null>(null);

    const buildedQueryParams = useMemo(() => {
        const queryParams = [];

        for (const [key, value] of searchParams.entries()) {
            queryParams.push({
                key,
                value
            });
        }

        return queryParams;
    }, [searchParams.toString()]);

    async function fetchHistory(showLoading = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        const response = await make_request("/audit-logs", RequestMethod.GET, {
            queryParams: [
                ...buildedQueryParams,
                {
                    key: "page",
                    value: page.toString()
                }
            ],
            signal
        });
        const responseJson = await response.json() as AuditLogHistoryResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            return;
        }

        setHistory(responseJson.data.map(entry => ({
            ...entry,
            timestamp: moment.unix(entry.timestamp)
        })));
        setMaxPages(responseJson.meta.pages);

        if (page > responseJson.meta.pages) {
            setPage(1);
        }

        if (showLoading) setLoading(false);
    }

    useWebSocketEvent("*", useCallback(() => {
        void fetchHistory(false);
    }, []));

    // Load history
    useEffect(() => {
        const controller = new AbortController();

        void fetchHistory(true, controller.signal);

        return () => {
            controller.abort();
        }
    }, [searchParams.toString(), page]);

    // Open modal if entry id is present in url
    useEffect(() => {
        if (id === undefined) return;

        setselectedEntryId(parseInt(id));
        setModalOpen(true);
    }, [id]);

    return (
        <>
            <ScreenSplit
                leftSidePercentage={30}
                leftSideComponent={<Filter/>}
            >
                <ManagementBar>
                    <div className={styles.managementBar}>
                        <DefaultPagination
                            page={page}
                            count={maxPages}
                            size={"large"}
                            onChange={(_event, page) => setPage(page)}
                        />
                    </div>
                </ManagementBar>

                <div className={styles.main}>
                    <Gate show={loading}>
                        <Loader fullDiv />
                    </Gate>

                    <Gate show={!loading}>
                        {history.map(entry => {
                            return (
                                <AuditLogEntryCard
                                    key={`entry#${entry.id}`}
                                    entry={entry}
                                    callback={() => {
                                        setselectedEntryId(entry.id);
                                        setModalOpen(true);
                                    }}
                                />
                            );
                        })}
                    </Gate>

                    <Gate show={!loading && history.length === 0}>
                        <DefaultTypography color={"black"} fontSize={"xx-large"}>Sem Resultados</DefaultTypography>
                    </Gate>
                </div>
            </ScreenSplit>

            <AuditLogModal
                id={selectedEntryId}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}

export default AuditLogs;