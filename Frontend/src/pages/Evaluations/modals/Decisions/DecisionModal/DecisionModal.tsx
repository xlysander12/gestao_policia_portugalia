import {ConfirmationDialog, Modal, ModalSection} from "../../../../../components/Modal";
import {InnerMinifiedDecision} from "../DecisionsListModal/DecisionsListModal.tsx";
import {getObjectFromId} from "../../../../../forces-data-context.ts";
import {useForceData, useWebSocketEvent} from "../../../../../hooks";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";
import {
    CreateCeremonyDecisionBody,
    EditCeremonyDecisionBody
} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/input";
import {RequestError, SOCKET_EVENT} from "@portalseguranca/api-types";
import {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {
    CeremonyDecision,
    CeremonyDecisionInfoResponse, CeremonyDecisionSocket, DeleteCeremonyDecisionSocket, UpdateCeremonyDecisionSocket
} from "@portalseguranca/api-types/officers/evaluations/ceremony_decisions/output";
import {make_request, RequestMethod} from "../../../../../utils/requests.ts";
import {toast} from "react-toastify";
import styles from "./styles.module.css";
import Gate from "../../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../../components/Loader";
import {
    DefaultButton,
    DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTypography
} from "../../../../../components/DefaultComponents";
import {EventDetailsResponse, EventsListResponse, MinifiedEvent} from "@portalseguranca/api-types/events/output";
import moment from "moment";
import {Divider, MenuItem, Skeleton} from "@mui/material";
import {useImmer} from "use-immer";
import {LoggedUserContext} from "../../../../../components/PrivateRoute/logged-user-context.ts";
import {EventPickerModal} from "../../../../../components/EventPicker";

type InnerDecision = Omit<CeremonyDecision, "ceremony_event"> & {
    ceremony_event: MinifiedEvent
}

type DecisionModalProps = {
    open: boolean
    onClose: () => void
    target: MinifiedOfficerData
    decision?: InnerMinifiedDecision | null
    newEntry?: boolean
}
function DecisionModal(props: DecisionModalProps) {
    const [forceData] = useForceData();
    const loggedUser = useContext(LoggedUserContext);

    const officerFullName = useMemo(() => (
        `${getObjectFromId(props.target.patent, forceData.patents)!.name} ${props.target.name}`
    ), [props.target.nif]);

    const PLACEHOLDER_DECISION: InnerDecision = {
        id: 0,
        target: props.target.nif,
        ceremony_event: {
            id: 0,
            start: 0,
            end: 0,
            title: "",
            force: localStorage.getItem("force")!
        },
        category: 0,
        decision: null,
        details: ""
    }

    const [loading, setLoading] = useState<boolean>(false);
    const [loadingNextCeremony, setLoadingNextCeremony] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);

    const [confirmationDialogOpen, setConfirmationDialogOpen] = useState<boolean>(false);

    const [decision, setDecision] = useImmer<InnerDecision>(PLACEHOLDER_DECISION);

    // Event Picker Modal
    const [eventPickerModalOpen, setEventPickerModalOpen] = useState<boolean>(false);

    function onClose() {
        setDecision(PLACEHOLDER_DECISION);
        setLoading(false);
        setLoadingNextCeremony(false);
        setEditMode(false);

        props.onClose();
    }

    async function getNextCeremony() {
        setLoadingNextCeremony(true);

        const response = await make_request("/events", RequestMethod.GET, {
            queryParams: [
                {
                    key: "force",
                    value: localStorage.getItem("force")!
                },
                {
                    key: "type",
                    value: forceData.event_types.filter(type => type.variant === "ceremony")[0].id.toString()
                },
                {
                    key: "start",
                    value: moment().unix().toString()
                },
                {
                    key: "end",
                    value: moment().add(1, "year").unix().toString()
                }
            ]
        });
        const responseJson: EventsListResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            onClose();
            return;
        }

        if (responseJson.data.length === 0) {
            // toast.warning("Não foi encontrada nenhuma cerimónia futura para associar a esta decisão.");
            setLoadingNextCeremony(false);
            return;
        }

        const nextCeremony = responseJson.data[0];

        setDecision(draft => {
            draft.ceremony_event = nextCeremony
        });
        setLoadingNextCeremony(false);
    }

    async function createDecision() {
        setLoading(true);

        const response = await make_request<CreateCeremonyDecisionBody>(`/officers/${props.target.nif}/evaluations/decisions`, RequestMethod.POST, {
            body: {
                category: decision.category,
                ceremony_event: decision.ceremony_event.id,
                decision: decision.decision,
                details: decision.details
            }
        });
        const responseJson: RequestError = await response.json();

        setLoading(false);

        if (!response.ok) {
            toast.error(responseJson.message);
            return;
        }

        toast.success("Decisão criada com sucesso.");

        onClose();
    }

    async function getFullDecisionDetails(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        const response = await make_request(`/officers/${props.target.nif}/evaluations/decisions/${props.decision?.id}`, RequestMethod.GET, {signal});
        const responseJson: CeremonyDecisionInfoResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            onClose();
            return;
        }

        const eventResponse = await make_request(`/events/${localStorage.getItem("force")}${responseJson.data.ceremony_event}`, RequestMethod.GET, {signal});
        const eventResponseJson: EventDetailsResponse = await eventResponse.json();

        if (!eventResponse.ok) {
            toast.error(eventResponseJson.message);
            onClose();
            return;
        }

        setDecision({
            ...responseJson.data,
            ceremony_event: eventResponseJson.data
        });
        if (showLoading) setLoading(false);
    }

    async function editDecision() {
        setLoading(true);

        const response = await make_request<EditCeremonyDecisionBody>(`/officers/${props.target.nif}/evaluations/decisions/${decision.id}`, RequestMethod.PATCH, {
            body: {
                decision: decision.decision!,
                details: decision.details
            }
        });
        const responseJson: RequestError = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        toast.success("Decisão editada com sucesso.");

        setEditMode(false);
        void getFullDecisionDetails(true);
    }

    async function deleteDecision() {
        setLoading(true);

        const response = await make_request(`/officers/${props.target.nif}/evaluations/decisions/${decision.id}`, RequestMethod.DELETE);
        const responseJson: RequestError = await response.json();

        setLoading(false);

        if (!response.ok) {
            toast.error(responseJson.message);
            return;
        }

        toast.success("Decisão apagada com sucesso.");

        onClose();
    }

    useWebSocketEvent<CeremonyDecisionSocket>(SOCKET_EVENT.CEREMONY_DECISIONS, useCallback(async (data) => {
        if (data.action === "add") return;

        if (data.action === "update" && (data as UpdateCeremonyDecisionSocket).id === props.decision?.id) {
            await getFullDecisionDetails(false);
            toast.warning("Esta decisão foi editada por outro utilizador.");
            return;
        }

        if (data.action === "delete" && (data as DeleteCeremonyDecisionSocket).id === props.decision?.id) {
            toast.warning("Esta decisão foi apagada por outro utilizador.");
            onClose();
            return;
        }
    }, [props.decision?.id]));

    useEffect(() => {
        const controller = new AbortController();

        if (props.open && !props.newEntry) {
            void getFullDecisionDetails(true, controller.signal);
        }

        if (props.open && props.newEntry) {
            setEditMode(true);
            void getNextCeremony();
        }

        return () => controller.abort();
    }, [props.open, props.newEntry, props.target.nif, props.decision?.id]);

    return (
        <Modal
            open={props.open}
            onClose={onClose}
            width={"50%"}
            title={!props.newEntry ? `Decisão sobre ${officerFullName} (#${props.decision?.id})` : `Nova decisão sobre ${officerFullName}`}
        >
            <div className={styles.mainDiv}>
                <Gate show={loading}>
                    <Loader fullDiv />
                </Gate>

                <Gate show={!loading}>
                    <ModalSection title={"Informações"}>
                        <div className={styles.mainDiv}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Cerimónia:</DefaultTypography>
                            <>
                                <Gate show={loadingNextCeremony}>
                                    <Skeleton width={"100%"} variant={"text"} />
                                </Gate>

                                <Gate show={!loadingNextCeremony}>
                                    <DefaultTypography
                                        clickable={props.newEntry}
                                        onClick={() => setEventPickerModalOpen(true)}
                                    >
                                        <Gate show={decision.ceremony_event.start === 0}>
                                            Selecionar cerimónia...
                                        </Gate>

                                        <Gate show={decision.ceremony_event.start !== 0}>
                                            {decision?.ceremony_event.title} - {moment.unix(decision?.ceremony_event.start ?? 0).format("DD/MM/YYYY")}
                                        </Gate>
                                    </DefaultTypography>
                                </Gate>
                            </>


                            <Divider flexItem sx={{marginBottom: "5px"}} />

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Categoria:</DefaultTypography>
                            <DefaultSelect
                                fullWidth
                                disabled={!props.newEntry}
                                sameTextColorWhenDisabled
                                value={decision.category}
                                onChange={(event) => {
                                    setDecision(draft => {
                                        draft.category = Number(event.target.value);
                                    });
                                }}
                            >
                                {forceData.patentCategories
                                    .filter(category => category.id >= getObjectFromId(props.target.patent, forceData.patents)!.category && category.id <= loggedUser.info.professional.patent.category)
                                    .map(category => (
                                        <MenuItem
                                            key={`category#${category.id}`}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </MenuItem>
                                    ))
                                }
                            </DefaultSelect>

                            <Divider flexItem sx={{marginBottom: "5px"}} />

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Decisão:</DefaultTypography>
                            <DefaultSelect
                                fullWidth
                                disabled={!editMode}
                                sameTextColorWhenDisabled
                                value={decision.decision ?? 0}
                                onChange={(event) => {
                                    const number_value = Number(event.target.value);

                                    setDecision(draft => {
                                        draft.decision = number_value === 0 ? null : number_value;
                                    });
                                }}
                            >
                                <MenuItem
                                    key={`decision#null`}
                                    value={0}
                                >
                                    Sem Decisão
                                </MenuItem>

                                {forceData.evaluation_decisions.map(decision => (
                                    <MenuItem
                                        key={`decision#${decision.id}`}
                                        value={decision.id}
                                    >
                                        {decision.name}
                                    </MenuItem>
                                ))}
                            </DefaultSelect>

                            <Divider flexItem sx={{marginBottom: "5px"}} />

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Detalhes:</DefaultTypography>
                            <DefaultOutlinedTextField
                                fullWidth
                                textWhenDisabled
                                multiline
                                disabled={!editMode}
                                value={decision.details}
                                onChange={(event) => {
                                    setDecision(draft => {
                                        draft.details = event.target.value;
                                    });
                                }}
                            />

                        </div>
                    </ModalSection>

                    <ModalSection title={"Ações"}>
                        <Gate show={!props.newEntry && !editMode}>
                            <div className={styles.actionsDiv}>
                                <DefaultButton
                                    fullWidth
                                    onClick={() => setEditMode(true)}
                                >Editar</DefaultButton>

                                <DefaultButton
                                    fullWidth
                                    buttonColor={"red"}
                                    onClick={() => setConfirmationDialogOpen(true)}
                                >Apagar</DefaultButton>
                            </div>
                        </Gate>

                        <Gate show={!props.newEntry && editMode}>
                            <div className={styles.actionsDiv}>
                                <DefaultButton
                                    fullWidth
                                    buttonColor={"lightgreen"}
                                    onClick={editDecision}
                                >Guardar</DefaultButton>

                                <DefaultButton
                                    fullWidth
                                    buttonColor={"red"}
                                    onClick={() => {
                                        setEditMode(false);
                                        void getFullDecisionDetails();
                                    }}
                                >Cancelar</DefaultButton>
                            </div>
                        </Gate>

                        <Gate show={!!props.newEntry}>
                            <DefaultButton
                                fullWidth
                                darkTextOnHover
                                buttonColor={"lightgreen"}
                                disabled={
                                    loadingNextCeremony ||
                                    decision.ceremony_event.id === 0 ||
                                    decision.category === 0
                                }
                                onClick={createDecision}
                            >
                                Criar Decisão
                            </DefaultButton>
                        </Gate>

                    </ModalSection>
                </Gate>
            </div>

            <EventPickerModal
                open={eventPickerModalOpen}
                onClose={() => setEventPickerModalOpen(false)}
                callback={event => {
                    setEventPickerModalOpen(false);
                    setDecision(draft => {
                        draft.ceremony_event = event
                    });
                }}
                filters={[
                    {key: "type", value: forceData.event_types.filter(type => type.variant === "ceremony")[0].id.toString()},
                    {key: "force", value: localStorage.getItem("force")!}
                ]}
            />

            <ConfirmationDialog
                open={confirmationDialogOpen}
                title={`Apagar decisão #${decision.id}`}
                text={"Tens a certeza que queres apagar esta decisão?\nEsta ação não é reversível"}
                onConfirm={deleteDecision}
                onDeny={() => setConfirmationDialogOpen(false)}
            />
        </Modal>
    )
}

export default DecisionModal;