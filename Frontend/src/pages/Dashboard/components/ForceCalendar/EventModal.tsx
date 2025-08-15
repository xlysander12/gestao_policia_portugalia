import {EventDetailsResponse, ExistingEventSocket, ForceEvent} from "@portalseguranca/api-types/events/output";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import {useCallback, useContext, useEffect, useState} from "react";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import { toast } from "react-toastify";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import moment, { Moment } from "moment";
import {
    DefaultButton,
    DefaultDateTimePicker, DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTextField,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {Divider, MenuItem, Stack, Tooltip} from "@mui/material";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {useForceData, useWebSocketEvent} from "../../../../hooks";
import OfficerList from "../../../../components/OfficerList";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {EventType, SpecialUnitData} from "@portalseguranca/api-types/util/output";
import {CreateEventBody, EditEventBody} from "@portalseguranca/api-types/events/input";
import {useImmer} from "use-immer";
import {BaseResponse, SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types";
import HelpIcon from "@mui/icons-material/Help";

type InnerForceEvent = Omit<ForceEvent, "type" | "special_unit" | "author" | "start" | "end" | "assignees"> & {
    type: EventType
    author: MinifiedOfficerData
    special_unit: SpecialUnitData | null
    assignees: MinifiedOfficerData[]
    start: Moment
    end: Moment
}

type EventModalProps = {
    open: boolean,
    onClose: () => void,
    id?: string
    newEntry?: boolean
    newEntryMoment?: Moment
}
function EventModal(props: EventModalProps) {
    // If both id and newEntry are undefined, throw an error
    if (props.id === undefined && props.newEntry === undefined) {
        throw new Error('Event modal must have, atleast, a newEntry or ID')
    }

    if (props.newEntry && !props.newEntryMoment) {
        throw new Error('Event modal must have a newEntryMoment prop when newEntry is true')
    }

    const [forceData, getForceData] = useForceData();

    const loggedUser = useContext(LoggedUserContext);

    const [loading, setLoading] = useState<boolean>(true);
    const [editMode, setEditMode] = useState<boolean>(false);

    const DEFAULT_EVENT_DATA: InnerForceEvent = {
        id: 0,
        force: localStorage.getItem("force")!,
        type: forceData.event_types.find(event_type => event_type.variant === "custom")!,
        special_unit: null,
        author: {
            name: loggedUser.info.personal.name,
            patent: loggedUser.info.professional.patent.id,
            callsign: loggedUser.info.professional.callsign,
            status: loggedUser.info.professional.status.id,
            nif: loggedUser.info.personal.nif,
            force: localStorage.getItem("force")!
        },
        title: "",
        description: null,
        start: moment(props.newEntryMoment)?.set("seconds", 0) ?? moment().set("seconds", 0),
        end: (moment(props.newEntryMoment).set("seconds", 0) ?? moment().set("seconds", 0)).add(1, "hours"),
        assignees: []
    }

    const [eventData, setEventData] = useImmer<InnerForceEvent>(DEFAULT_EVENT_DATA);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);

    const author_full_name = `[${eventData?.author?.callsign}] ${getObjectFromId(eventData.author.patent, getForceData(eventData.author.force ?? localStorage.getItem("force")!).patents)!.name} ${eventData.author.name}`;

    const canSave = !((eventData.type.variant === "custom" && eventData.title === "") ||
                            (eventData.type.variant === "special_unit" && !eventData.special_unit) ||
                            (!eventData.start.isValid() || !eventData.end.isValid()) ||
                            (eventData.start > eventData.end) ||
                            (eventData.end.diff(eventData.start, "seconds") < 3600) ||
                            (eventData.title.trim().length > 255));

    async function fetchEvent(showLoading = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        // Query the backend
        const response = await make_request(`/events/${props.id}`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as EventDetailsResponse;

        // If the response wasn't ok, show an error
        if (!response.ok) {
            toast.error(responseJson.message);
            props.onClose();
            return;
        }

        // Get the Data of the author
        const authorResponse = await make_request(`/officers/${responseJson.data.author}?patrol=true`, RequestMethod.GET, {signal});
        const authorResponseJson = await authorResponse.json() as OfficerInfoGetResponse;

        if (!authorResponse.ok) {
            toast.error(authorResponseJson.message);
            return;
        }

        // Get the officer data of all assignees
        const assigness: MinifiedOfficerData[] = []
        for (const assigneeNif of responseJson.data.assignees) {
            const assigneeResponse = await make_request(`/officers/${assigneeNif}?patrol=true`, RequestMethod.GET, {signal});
            const assigneeResponseJson = await assigneeResponse.json() as OfficerInfoGetResponse;

            if (!assigneeResponse.ok) {
                toast.warning(`Não foi possível obter as informações do efetivo de NIF ${assigneeNif}`);
                continue;
            }

            assigness.push(assigneeResponseJson.data);
        }

        // Apply the data to the state
        setEventData({
            id: responseJson.data.id,
            force: responseJson.data.force,
            type: getObjectFromId(responseJson.data.type, getForceData(responseJson.data.force).event_types)!,
            special_unit: responseJson.data.special_unit ? getObjectFromId(responseJson.data.special_unit, getForceData(responseJson.data.force).special_units) : null,
            author: authorResponseJson.data,
            title: responseJson.data.title,
            description: responseJson.data.description,
            assignees: assigness,
            start: moment.unix(responseJson.data.start).set("seconds", 0),
            end: moment.unix(responseJson.data.end).set("seconds", 0)
        });

        // Set the loading to false
        setLoading(false);
    }

    async function createEvent() {
        // Set the loading flag to true
        setLoading(true);

        // Make the request to create the event
        const response = await make_request<CreateEventBody>("/events", RequestMethod.POST, {
            body: {
                type: eventData.type.id,
                special_unit: eventData.type.variant === "special_unit" ? eventData.special_unit!.id : null,
                title: eventData.type.variant === "custom" ? eventData.title : null,
                description: eventData.description?.trim(),
                assignees: eventData.type.variant === "custom" ? eventData.assignees.map(officer => officer.nif) : [],
                start: eventData.start.unix(),
                end: eventData.end.unix()
            }
        });
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        // If the creation went OK, disable edit mode, loading state and close the modal
        toast.success("Evento criado com sucesso");
        setEditMode(false);
        setLoading(false);

        props.onClose();
    }

    async function editEvent() {
        // Set the loading flag to true
        setLoading(true);

        // Make the request to create the event
        const response = await make_request<EditEventBody>(`/events/${eventData.force}${eventData.id}`, RequestMethod.PATCH, {
            body: {
                description: eventData.description?.trim(),
                assignees: eventData.type.variant === "custom" ? eventData.assignees.map(officer => officer.nif) : [],
                start: eventData.start.unix(),
                end: eventData.end.unix()
            }
        });
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        // If the creation went OK, disable edit mode, loading state and refresh the data
        toast.success("Evento editado com sucesso");
        setEditMode(false);

        await fetchEvent();
    }

    async function deleteEvent() {
        // Set the loading flag to true
        setLoading(true);

        // Make the request to create the event
        const response = await make_request<EditEventBody>(`/events/${eventData.force}${eventData.id}`, RequestMethod.DELETE);
        const responseJson = await response.json() as BaseResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        // If the deletion went OK, disable loading state and close the modal
        toast.success("Evento apagado com sucesso");
        setLoading(false);

        props.onClose();
    }

    // Listen for Websocket Events
    useWebSocketEvent<SocketResponse>(SOCKET_EVENT.EVENTS, useCallback((data) => {
        // If we are creating a new Event, ignore it
        if (props.newEntry) return;

        // If the action of the Event was the addition of a new one, ignore
        if (data.action ===  "add") return;

        // If the event was triggered by the logged user, ignore it
        if (data.by === loggedUser.info.personal.nif) return;

        // If the target event wasn't the one being edited, ignore
        if ((data as ExistingEventSocket).id !== eventData.id || (data as ExistingEventSocket).force !== eventData.force) return;

        // If the event was edited, updated the values and alert the user
        if (data.action === "update") {
            // Only update it if not in edit mode
            if (editMode) return;

            toast.warning("O evento que estavas a visualizar foi editado!");
            void fetchEvent();
            return;
        }

        // If the event was deleted, inform the user and close the modal
        if (data.action === "delete") {
            toast.warning("O evento que estavas a visualizar foi apagado!");
            props.onClose();
        }
    }, [loggedUser.info.personal.nif, props.newEntry, eventData.id, eventData.force, editMode, props.onClose]));

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (props.open && !props.newEntry) {
            void fetchEvent(true, signal);
        }

        if (props.newEntry) {
            setEditMode(true);
        }

        return () => {
            controller.abort();
            setEventData(DEFAULT_EVENT_DATA);
            setLoading(false);
            setEditMode(false);
        }
    }, [props.id, props.open, props.newEntry, props.newEntryMoment?.toISOString()]);

    // Update the start and end date when then newEntryMoment changes
    useEffect(() => {
        setEventData(draft => {
            draft.start = moment(props.newEntryMoment)?.set("seconds", 0) ?? moment().set("seconds", 0);
            draft.end = (moment(props.newEntryMoment).set("seconds", 0) ?? moment().set("seconds", 0)).add(1, "hours");
        })
    }, [props.newEntryMoment?.unix()]);


    return (
        <>
            <Modal
                open={props.open}
                onClose={props.onClose}
                title={props.newEntry ? "Novo Evento": `Evento #${props.id!.toUpperCase()}`}
                url={props.newEntry || loading ? undefined : `/e/${eventData.force}${eventData.id}`}
                width={"50%"}
            >
                <Gate show={loading}>
                    <Loader size={"98px"} fullDiv />
                </Gate>

                <Gate show={!loading}>
                    <ModalSection title={"Detalhes"}>
                        <Gate show={!!props.newEntry}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo de Evento:</DefaultTypography>
                            <DefaultSelect
                                fullWidth
                                value={eventData.type.id}
                                onChange={(event) => {
                                    setEventData(draft => {
                                        draft.type = getObjectFromId(event.target.value as number, forceData.event_types)!;
                                    })
                                }}
                            >
                                {forceData.event_types.map(event_type => {
                                    return (
                                        <MenuItem
                                            disabled={event_type.intent !== null ? !loggedUser.intents[event_type.intent] : false}
                                            key={`event_type#${event_type.id}`}
                                            value={event_type.id}
                                        >
                                            {event_type.name}
                                        </MenuItem>
                                    )
                                })}
                            </DefaultSelect>

                            <Divider sx={{marginBottom: "5px"}}/>
                        </Gate>

                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Título:</DefaultTypography>
                        <DefaultTextField
                            fullWidth
                            disabled={!props.newEntry || eventData.type.variant !== "custom"}
                            textWhenDisabled={eventData.type.variant !== "custom"}
                            placeholder={eventData.type.variant !== "custom" ? "Título Automático" : undefined}
                            value={eventData.type.variant === "custom" || !props.newEntry ? eventData.title : ""}
                            error={eventData.title === "" || eventData.title.trim().length > 255}
                            onChange={(event) => {
                                setEventData(draft => {
                                    draft.title = event.target.value;
                                });
                            }}
                        />

                        <Divider sx={{marginBottom: "5px"}}/>

                        <Gate show={!props.newEntry}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Autor:</DefaultTypography>
                            <DefaultTypography>
                                {author_full_name}
                            </DefaultTypography>

                            <Divider sx={{marginBottom: "5px"}}/>
                        </Gate>

                        <Gate show={eventData.type.variant === "special_unit" && !!props.newEntry}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade Especial:</DefaultTypography>
                            <DefaultSelect
                                fullWidth
                                disabled={!props.newEntry}
                                sameTextColorWhenDisabled
                                value={eventData.special_unit?.id}
                                error={!eventData.special_unit}
                                onChange={(event) => {
                                    setEventData(draft => {
                                        draft.special_unit = getObjectFromId(event.target.value as number, forceData.special_units)
                                    })
                                }}
                            >
                                {forceData.special_units.map(unit => (
                                    <MenuItem
                                        disabled={!loggedUser.info.professional.special_units.some(special_unit => special_unit.unit.id === unit.id)}
                                        key={`specialunit#${unit.id}`}
                                        value={unit.id}
                                    >
                                        {unit.name}
                                    </MenuItem>
                                ))}
                            </DefaultSelect>

                            <Divider sx={{marginBottom: "5px"}}/>
                        </Gate>


                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                gap: "20px",
                                justifyContent: "flex-start"
                            }}
                        >
                            <div>
                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Início:</DefaultTypography>
                                <DefaultDateTimePicker
                                    disabled={!editMode}
                                    textWhenDisabled
                                    value={eventData.start}
                                    slotProps={{
                                        textField: {
                                            error: !eventData.start.isValid() || eventData.start > eventData.end
                                        }
                                    }}
                                    onChange={(value) => {
                                        setEventData(draft => {
                                            draft.start = moment(value?.set("seconds", 0));
                                        });
                                    }}
                                />
                            </div>

                            <div>
                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Fim:</DefaultTypography>
                                <Stack
                                    direction={"row"}
                                    gap={"10px"}
                                >
                                    <DefaultDateTimePicker
                                        disabled={!editMode}
                                        textWhenDisabled
                                        value={eventData.end}
                                        slotProps={{
                                            textField: {
                                                error: !eventData.end.isValid() || eventData.start > eventData.end || eventData.end.diff(eventData.start, "hours") < 1
                                            }
                                        }}
                                        onChange={(value) => {
                                            setEventData(draft => {
                                                draft.end = moment(value?.set("seconds", 0));
                                            });
                                        }}
                                    />

                                    <Gate show={eventData.end.diff(eventData.start, "hours") < 1}>
                                        <Tooltip
                                            title={"Um evento tem que ter, no mínimo, 1 hora de duração!"}
                                            arrow
                                            describeChild
                                            placement={"right"}
                                            componentsProps={{
                                                tooltip: {
                                                    sx: {
                                                        whiteSpace: "pre-line",
                                                        fontSize: "14px"
                                                    }
                                                }
                                            }}
                                        >
                                            <HelpIcon />
                                        </Tooltip>
                                    </Gate>
                                </Stack>
                            </div>
                        </div>

                        <Divider sx={{margin: "5px 0"}}/>

                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Descrição:</DefaultTypography>
                        <DefaultOutlinedTextField
                            fullWidth
                            multiline
                            disabled={!editMode}
                            textWhenDisabled
                            placeholder={"Sem descrição"}
                            value={eventData.description ?? ""}
                            onChange={(event) => {
                                setEventData(draft => {
                                   draft.description = event.target.value;
                                });
                            }}
                        />
                    </ModalSection>

                    <Gate show={eventData.type.variant === "custom" && (eventData.assignees.length > 0 || editMode)}>
                        <ModalSection title={"Efetivos Associados"}>
                            <OfficerList
                                invisibleDisabled={!editMode}
                                startingOfficers={eventData.assignees}
                                enableSelfDelete
                                changeCallback={(officers) => {
                                    setEventData(draft => {
                                        draft.assignees = officers;
                                    });
                                }}
                            />
                        </ModalSection>
                    </Gate>

                    <Gate show={(eventData.author.nif === loggedUser.info.personal.nif || loggedUser.intents.events) && eventData.force === localStorage.getItem("force")}>
                        <ModalSection title={"Ações"}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: "10px"
                                }}
                            >
                                <Gate show={!props.newEntry && !editMode}>
                                    <DefaultButton
                                        sx={{flex: 1}}
                                        onClick={() => setEditMode(true)}
                                    >
                                        Editar
                                    </DefaultButton>

                                    <DefaultButton
                                        sx={{flex: 1}}
                                        buttonColor={"red"}
                                        onClick={() => setDeleteConfirmationOpen(true)}
                                    >
                                        Apagar
                                    </DefaultButton>
                                </Gate>

                                <Gate show={!props.newEntry && editMode}>
                                    <DefaultButton
                                        sx={{flex: 1}}
                                        buttonColor={"lightgreen"}
                                        darkTextOnHover
                                        onClick={editEvent}
                                        disabled={!canSave}
                                    >
                                        Guardar
                                    </DefaultButton>

                                    <DefaultButton
                                        sx={{flex: 1}}
                                        buttonColor={"red"}
                                        onClick={() => {
                                            setEditMode(false);
                                            void fetchEvent();
                                        }}
                                    >
                                        Cancelar
                                    </DefaultButton>
                                </Gate>

                                <Gate show={!!props.newEntry}>
                                    <DefaultButton
                                        sx={{flex: 1}}
                                        buttonColor={"lightgreen"}
                                        darkTextOnHover
                                        onClick={createEvent}
                                        disabled={!canSave}
                                    >
                                        Criar Evento
                                    </DefaultButton>
                                </Gate>
                            </div>
                        </ModalSection>
                    </Gate>
                </Gate>
            </Modal>

            <ConfirmationDialog
                open={deleteConfirmationOpen}
                title={`Apagar Evento #${eventData.force.toUpperCase()}${eventData.id}`}
                text={"Tens a certeza que queres apagar este Evento?\nEsta ação não pode ser revertida!"}
                onConfirm={deleteEvent}
                onDeny={() => setDeleteConfirmationOpen(false)}
            />
        </>
    );
}

export default EventModal;