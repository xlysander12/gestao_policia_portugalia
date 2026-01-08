import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";
import {Modal} from "../../../../../components/Modal";
import {getObjectFromId} from "../../../../../forces-data-context.ts";
import {useForceData, useWebSocketEvent} from "../../../../../hooks";
import {useCallback, useEffect, useState} from "react";
import {
    CeremonyDecisionsListResponse, CeremonyDecisionSocket,
    MinifiedDecision
} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import ManagementBar from "../../../../../components/ManagementBar";
import styles from "./list-styles.module.css";
import {
    DefaultButton,
    DefaultPagination,
    DefaultSearch,
    DefaultTypography
} from "../../../../../components/DefaultComponents";
import {make_request, RequestMethod} from "../../../../../utils/requests.ts";
import {toast} from "react-toastify";
import Gate from "../../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../../components/Loader";
import {EventDetailsResponse, ForceEvent} from "@portalseguranca/api-types/events/output";
import DecisionCard, {MockDecisionCard} from "./DecisionCard.tsx";
import moment, {Moment} from "moment";
import {FormControlLabel, Switch} from "@mui/material";
import { SOCKET_EVENT } from "@portalseguranca/api-types";

export type InnerMinifiedDecision = Omit<MinifiedDecision, "ceremony_event"> & {
    ceremony_event: Omit<ForceEvent, "start"> & {start: Moment}
}

type DecisionsListModalProps = {
    open: boolean
    onClose: () => void
    target: MinifiedOfficerData
};
function DecisionsListModal(props: DecisionsListModalProps) {

    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [maxPages, setMaxPages] = useState<number>(1);

    const [showOldDecisions, setShowOldDecisions] = useState<boolean>(false);

    const [decisions, setDecisions] = useState<InnerMinifiedDecision[]>([]);
    const [filters, setFilters] = useState<{key: string, value: any}[]>([]);

    async function fetchDecisions(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        const response = await make_request(`/officers/${props.target.nif}/evaluations/decisions`, RequestMethod.GET, {
            queryParams: [...filters, {key: "page", value: page}],
            signal
        });
        const responseJson: CeremonyDecisionsListResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            props.onClose();
            return;
        }

        setMaxPages(responseJson.meta.pages);

        // * Get the event details for each decision
        // Create temp variable to hold the list
        const tempList: InnerMinifiedDecision[] = [];

        for (const decision of responseJson.data) {
            // Fetch event details
            const eventResponse = await make_request(`/events/${localStorage.getItem("force")}${decision.ceremony_event}`, RequestMethod.GET);
            const eventJson: EventDetailsResponse = await eventResponse.json();

            if (!eventResponse.ok) {
                toast.error(`Erro ao obter detalhes do evento da decisão #${decision.id}.`);
                continue;
            }

            tempList.push({
                ...decision,
                ceremony_event: {
                    ...eventJson.data,
                    start: moment.unix(eventJson.data.start)
                }
            });
        }

        setDecisions(tempList);
        setLoading(false);
    }

    useWebSocketEvent<CeremonyDecisionSocket>(SOCKET_EVENT.CEREMONY_DECISIONS, useCallback((data) => {
        if (!props.open) return; // Don't do anything if modal is closed

        if (data.target !== props.target.nif) return; // Not for this officer

        // Refresh the list
        void fetchDecisions(false);
    }, [props.open, props.target.nif]));

    useEffect(() => {
        const controller = new AbortController();

        if (props.open) void fetchDecisions(true, controller.signal);

        return () => {
            controller.abort();
        }
    }, [props.open, props.target.nif, page, JSON.stringify(filters)]);

    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={`Decisões sobre ${getObjectFromId(props.target.patent, forceData.patents)!.name} ${props.target.name}`}
            width={"75%"}
            height={"80vh"}
        >
            <div style={{
                boxSizing: "border-box",
                backgroundColor: "var(--portalseguranca-color-background-light)",
                padding: "10px",
                height: "100%",
                width: "100%"
            }}>
                <ManagementBar>
                    <div className={styles.decisionsListManagementDiv}>
                        <FormControlLabel
                            label={(
                                <>
                                    Mostrar
                                    <br/>
                                    antigas
                                </>
                            )}
                            labelPlacement={"start"}
                            control={
                                <Switch onChange={(event) => setShowOldDecisions(event.target.checked)} />
                            }
                            checked={showOldDecisions}
                            slotProps={{
                                typography: {
                                    color: "white"
                                }
                            }}
                            sx={{
                                marginLeft: 0,
                                flex: "1 0 auto"
                            }}
                        />

                        <DefaultSearch
                            fullWidth
                            size={"small"}
                            placeholder={"Pesquisar por decisões"}
                            options={[
                                {key: "before", label: "Antes de", type: "date"},
                                {key: "after", label: "Depois de", type: "date"},
                                {key: "category", label: "Categoria", type: "option",
                                    options: forceData.patentCategories
                                        .filter(category => category.id >= getObjectFromId(props.target.patent, forceData.patents)!.category)
                                        .map(category => ({key: String(category.id), label: category.name}))
                                }
                            ]}
                            callback={(options) => setFilters(options)}
                            sx={{
                                flex: "0 1 auto"
                            }}
                        />

                        <DefaultPagination
                            count={maxPages}
                            page={page}
                            onChange={(_event, newPage) => setPage(newPage)}
                            siblingCount={1}
                            showFirstButton
                            sx={{
                                flex: "1 0 auto"
                            }}
                        />

                        <DefaultButton
                            onClick={() => {}}
                            sx={{
                                flex: "1 0 auto"
                            }}
                        >
                            Adicionar
                        </DefaultButton>
                    </div>
                </ManagementBar>

                <div className={styles.decisionsListListDiv}>
                    <Gate show={loading}>
                        <Loader fullDiv />
                    </Gate>

                    <Gate show={!loading && decisions.length === 0}>
                        <DefaultTypography
                            color={"var(--portalseguranca-color-text-dark)"}
                            fontSize={"xx-large"}
                            sx={{alignSelf: "center"}}
                        >
                            Sem Registos
                        </DefaultTypography>
                    </Gate>

                    <Gate show={!loading && decisions.length > 0}>
                        {decisions.map(decision => {
                            // If the toggle to show old decisions is on, show all decisions
                            if (showOldDecisions) {
                                return (
                                    <DecisionCard key={`decision#${decision.id}`} callback={() => {}} decision={decision} />
                                );
                            }

                            // Otherwise, only show decisions for events that are in the future
                            if (decision.ceremony_event.start.isSameOrAfter(moment(), "day")) {
                                return (
                                    <DecisionCard key={`decision#${decision.id}`} callback={() => {}} decision={decision} />
                                );
                            }

                            // Create mock cards to past decisions
                            return (
                                <MockDecisionCard key={`decisions#${decision.id}`}/>
                            );
                        })}
                    </Gate>
                </div>
            </div>
        </Modal>

    );
}

export default DecisionsListModal;