import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {ExistingPatrolSocket, PatrolData, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import moment, {Moment} from "moment";
import {useImmer} from "use-immer";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import {useCallback, useContext, useEffect, useState} from "react";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import {Loader} from "../../../../components/Loader";
import Gate from "../../../../components/Gate/gate.tsx";
import style from "./patrol-info-modal.module.css"
import {
    DefaultButton,
    DefaultDateTimePicker,
    DefaultOutlinedTextField,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {useForceData, useWebSocketEvent} from "../../../../hooks";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {Divider} from "@mui/material";
import {PatrolTypeData, SpecialUnitData} from "@portalseguranca/api-types/util/output";
import {EditPatrolBody} from "@portalseguranca/api-types/patrols/input";
import {BaseResponse, RequestError, SOCKET_EVENT} from "@portalseguranca/api-types";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import OfficerList from "../../../../components/OfficerList";

type InnerOfficerData = MinifiedOfficerData & {
    force: string
}

type InnerPatrolData = Omit<PatrolData, "start" | "end" | "officers" | "type" | "unit" | "registrar"> & {
    type: PatrolTypeData
    unit: SpecialUnitData | null
    registrar: InnerOfficerData
    start: Moment
    end: Moment | null
    officers: InnerOfficerData[],
    editable: boolean
}

type PatrolInfoModalProps = {
    open: boolean
    onClose: () => void
    id: string | null
}

function PatrolInfoModal(props: PatrolInfoModalProps) {
    const loggedUser = useContext(LoggedUserContext);

    const [, getForceData] = useForceData();
    
    const [patrolData, setPatrolData] = useImmer<InnerPatrolData | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // Handle WebSocket events
    useWebSocketEvent<ExistingPatrolSocket>(SOCKET_EVENT.PATROLS, useCallback(async (event) => {
        // If the modal isn't open, ignore the event
        if (!open) return;

        if (event.action === "add") return; // If a new patrol is added, it doesn't interfere with the current patrol

        if (`${event.force}${event.id}` !== props.id) return; // If the event isn't related to the current patrol, ignore it

        // If the patrol was just edited by the user, ignore the event
        if (event.by === loggedUser.info.personal.nif) return;

        // If the patrol gets deleted, close the modal and inform the user
        if (event.action === "delete") {
            toast.warning(`A patrulha que estavas a visualizar foi apagada!`);

            handleModalClose();
            return;
        }

        // If the patrol gets updated, fetch the new data
        if (event.action === "update" && !editMode) { // Can't update the patrol if is being edited
            await fetchPatrolData(false);
            toast.warning(`A patrulha que estavas a visualizar foi atualizada!`);
            return;
        }
    }, [props.id, editMode, props.open]));

    // Getting the patrol force from the id
    const patrolForce = props.id ? props.id.match(/([a-z]+)(\d+)$/)![1]: "";
    
    async function fetchPatrolData(showLoading: boolean = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        // Fetch the patrol data
        const response = await make_request(`/patrols/${props.id}`, RequestMethod.GET, {signal});
        const responseJson: PatrolInfoResponse = await response.json();

        // If the response wasn't positive, return null and display the error message
        if (!response.ok) {
            toast.error(responseJson.message);
            handleModalClose();
            return;
        }

        // Get the data of the registrar of the patrol
        const registrarResponse = await make_request(`/officers/${responseJson.data.registrar}?patrol=true`, RequestMethod.GET, {signal});
        const registrarResponseJson: OfficerInfoGetResponse = await registrarResponse.json();

        if (!registrarResponse.ok) {
            toast.error(registrarResponseJson.message);
            handleModalClose();
            return;
        }

        // Create a temp var to store the data
        const temp: InnerPatrolData = {
            ...responseJson.data,
            type: getObjectFromId(responseJson.data.type, getForceData(patrolForce).patrol_types)!,
            registrar: {
                ...registrarResponseJson.data,
                force: registrarResponseJson.data.force ?? localStorage.getItem("force")!
            },
            start: moment.unix(responseJson.data.start),
            end: responseJson.data.end ? moment.unix(responseJson.data.end) : null,
            officers: [],
            unit: responseJson.data.unit ? getObjectFromId(responseJson.data.unit, getForceData(patrolForce).special_units)! : null,
            editable: responseJson.meta.editable
        }

        // Fetch all the information about the officers of the patrol and store it apropriately
        for (const officerNif of responseJson.data.officers) {
            // Make the request to fetch the officer's data
            const officerResponse = await make_request(`/officers/${officerNif}?patrol=true`, "GET", {signal});
            const officerResponseJson: OfficerInfoGetResponse = await officerResponse.json();

            // Make sure the request was successful
            if (!officerResponse.ok) {
                toast.warning(`Não foi possível obter a informação do agente com o NIF ${officerNif}`);
                temp.officers.push({
                    name: "Desconhecido",
                    patent: 0,
                    status: 0,
                    nif: officerNif,
                    callsign: "N/A",
                    force: localStorage.getItem("force")!
                });

                continue;
            }

            temp.officers.push({
                ...officerResponseJson.data,
                force: officerResponseJson.data.force ?? localStorage.getItem("force")!
            });
        }

        setPatrolData(temp);
        if (showLoading) setLoading(false);
    }

    const handleSave = async () => {
        // Set the loading flag to true
        setLoading(true);

        const response = await make_request<EditPatrolBody>(`/patrols/${props.id}`, "PATCH", {
            body: {
                start: patrolData!.start.unix(),
                officers: patrolData!.officers.map(officer => officer.nif),
                end: patrolData!.end ? patrolData!.end.unix(): null,
                notes: patrolData!.notes === "" ? null: patrolData!.notes
            }
        });

        const responseJson: BaseResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        toast.success("Patrulha guardada com sucesso!");
        setEditMode(false);

        // Fetch the details of the patrol again
        await fetchPatrolData();
    }

    const handleDelete = async () => {
        // Make sure the confirmation dialog is closed
        setConfirmDelete(false);

        const response = await make_request(`/patrols/${props.id}`, "DELETE");
        const responseJson: RequestError = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            return;
        }

        toast.success(responseJson.message);

        // Close the modal
        handleModalClose();
    }

    const handleModalClose = () => {
        setEditMode(false);
        setPatrolData(null);
        props.onClose();
    }
    
    // * Fetch the patrol data when the component is mounted, and edit is canceled or the id changes
    useEffect(() => {
        const controller = new AbortController();

        if (props.open) {
            void fetchPatrolData(true, controller.signal);
        }

        return () => {
            controller.abort();
        }
    }, [props.id, props.open]);

    if (loading || patrolData === null) {
        return (
            <Modal
                width={"50%"}
                open={props.open}
                title={`Patrulha ${props.id === null ? "": `#${props.id.toUpperCase()}`}`}
                onClose={handleModalClose}
            >
                <Loader size={"100px"}/>
            </Modal>
        );
    }

    return (
        <>
            <Modal
                width={"50%"}
                open={props.open}
                title={`Patrulha #${props.id!.toUpperCase()} - ${patrolData.canceled ? "Cancelada": patrolData.end ? "Terminada": "Em curso..."}`}
                onClose={handleModalClose}
                url={`/patrulhas/${props.id}`}
            >
                <div className={style.mainDiv}>
                    <ModalSection title={"Informações Gerais"}>
                        <div className={style.mainDiv}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo:</DefaultTypography>
                            <DefaultTypography>{patrolData.type.name}</DefaultTypography>

                            <Divider flexItem sx={{marginBottom: "10px"}} />

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Registada por:</DefaultTypography>
                            <DefaultTypography>{getObjectFromId(patrolData.registrar.patent, getForceData(patrolData.registrar.force).patents)?.name} {patrolData.registrar.name}</DefaultTypography>

                            <Divider flexItem sx={{marginBottom: "10px"}} />

                            <Gate show={patrolData.unit !== null}>
                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade:</DefaultTypography>
                                <DefaultTypography>{patrolData.unit !== null ? `${patrolData.unit.name} (${patrolData.unit.acronym})`: ""}</DefaultTypography>

                                <Divider flexItem sx={{marginBottom: "10px"}} />
                            </Gate>
                            <div className={style.datesDiv}>
                                <div className={style.soloDateDiv}>
                                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Início:</DefaultTypography>
                                    <DefaultDateTimePicker
                                        disabled={!editMode || loading}
                                        textWhenDisabled={!loading}
                                        disableFuture
                                        value={patrolData.start}
                                        onChange={(date) => setPatrolData(draft => {draft!.start = date!})}
                                        sx={{width: "190px"}}
                                    />
                                </div>

                                <div className={style.soloDateDiv}>
                                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Fim:</DefaultTypography>
                                    <DefaultDateTimePicker
                                        disabled={!editMode || loading}
                                        textWhenDisabled={!loading}
                                        disableFuture
                                        value={patrolData.end}
                                        onChange={(date) => setPatrolData(draft => {draft!.end = date})}
                                        sx={{width: "190px"}}
                                        clearable
                                    />
                                </div>
                            </div>

                            <Divider flexItem sx={{marginBottom: "10px"}} />

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Observações:</DefaultTypography>

                            <DefaultOutlinedTextField
                                disabled={!editMode || loading}
                                fullWidth
                                textWhenDisabled={!loading}
                                placeholder={"Sem observações"}
                                value={patrolData.notes ? patrolData.notes: ""}
                                onChange={(e) => setPatrolData(draft => {draft!.notes = e.target.value})}
                                multiline
                            />
                        </div>
                    </ModalSection>

                    <ModalSection title={"Membros"}>
                        <div
                            style={{overflowY: "visible"}}
                        >
                            <OfficerList
                                startingOfficers={patrolData.officers}
                                changeCallback={(officers) => {
                                    setPatrolData(draft => {
                                        draft!.officers = officers as InnerOfficerData[];
                                    });
                                }}
                                invisibleDisabled={!editMode}
                                disabled={loading}
                                enableSelfDelete
                            />
                        </div>
                    </ModalSection>

                    <Gate show={patrolData.editable}>
                        <ModalSection title={"Ações"}>
                            <div className={style.actionsDiv}>
                                <Gate show={!editMode}>
                                    <DefaultButton
                                        sx={{flex: 1}}
                                        onClick={() => setEditMode(true)}
                                    >
                                        Editar
                                    </DefaultButton>

                                    <Gate show={loggedUser.intents.patrols}>
                                        <DefaultButton
                                            buttonColor={"red"}
                                            sx={{flex: 1}}
                                            onClick={() => setConfirmDelete(true)}
                                        >
                                            Apagar
                                        </DefaultButton>
                                    </Gate>
                                </Gate>

                                <Gate show={editMode}>
                                    <DefaultButton
                                        disabled={patrolData.start.isAfter(patrolData.end) || patrolData.start.isAfter(moment()) || (patrolData.end ? patrolData.end.isAfter(moment()): false)}
                                        buttonColor={"lightgreen"}
                                        darkTextOnHover
                                        sx={{flex: 1}}
                                        onClick={handleSave}
                                    >
                                        Guardar
                                    </DefaultButton>

                                    <DefaultButton
                                        buttonColor={"red"}
                                        darkTextOnHover
                                        sx={{flex: 1}}
                                        onClick={() => {
                                            setEditMode(false);
                                            void fetchPatrolData();
                                        }}
                                    >
                                        Cancelar
                                    </DefaultButton>
                                </Gate>
                            </div>
                        </ModalSection>
                    </Gate>
                </div>
            </Modal>

            <ConfirmationDialog
                open={confirmDelete}
                title={`Apagar Patrulha #${props.id}`}
                text={"Tens a certeza que desejas apagar esta patrulha?\n" +
                        "Esta ação não pode ser revertida!"}
                onConfirm={handleDelete}
                onDeny={() => setConfirmDelete(false)}
            />
        </>
    );
}

export default PatrolInfoModal;