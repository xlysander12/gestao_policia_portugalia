import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {PatrolData, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import moment, { Moment } from "moment";
import {useImmer} from "use-immer";
import {make_request} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import {FormEvent, useEffect, useState} from "react";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import Loader from "../../../../components/Loader/loader.tsx";
import Gate from "../../../../components/Gate/gate.tsx";
import style from "./patrol-info-modal.module.css"
import {
    DefaultButton,
    DefaultDateTimePicker,
    DefaultOutlinedTextField,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {useForceData} from "../../../../hooks";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {Divider, List, ListItem, ListItemText} from "@mui/material";
import {PatrolTypeData, SpecialUnitData} from "@portalseguranca/api-types/util/output";
import {EditPatrolBody} from "@portalseguranca/api-types/patrols/input";
import {RequestError, RequestSuccess} from "@portalseguranca/api-types";

type InnerOfficerData = MinifiedOfficerData & {
    force: string
}

type InnerPatrolData = Omit<PatrolData, "start" | "end" | "officers" | "type" | "unit"> & {
    type: PatrolTypeData
    unit: SpecialUnitData | null
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

function PatrolInfoModal({open, onClose, id}: PatrolInfoModalProps) {
    const [, getForceData] = useForceData();
    
    const [patrolData, setPatrolData] = useImmer<InnerPatrolData | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

    // Getting the patrol force from the id
    const patrolForce = id === null ? "": id.match(/([a-z]+)(\d+)$/)![1];
    
    const fetchPatrolData = async (id: string): Promise<InnerPatrolData | null> => {
        // Fetch the patrol data
        const response = await make_request(`/patrols/${id}`, "GET");
        const responseJson: PatrolInfoResponse = await response.json();

        // If the response wasn't positive, return null and display the error message
        if (!response.ok) {
            toast.error(responseJson.message);
            return null;
        }

        // Create a temp var to store the data
        const temp: InnerPatrolData = {
            ...responseJson.data,
            type: getObjectFromId(responseJson.data.type, getForceData(patrolForce).patrol_types)!,
            start: moment(responseJson.data.start),
            end: responseJson.data.end ? moment(responseJson.data.end) : null,
            officers: [],
            unit: responseJson.data.unit ? getObjectFromId(responseJson.data.unit, getForceData(patrolForce).special_units)! : null,
            editable: responseJson.meta.editable
        }

        // Fetch all the information about the officers of the patrol and store it apropriately
        for (const officerNif of responseJson.data.officers) {
            // Make the request to fetch the officer's data
            const officerResponse = await make_request(`/officers/${officerNif}?patrol=true`, "GET");
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
                force: officerResponseJson.meta.force
            });
        }

        return temp;
    }

    const handleSave = async (event: FormEvent) => {
        // Prevent the default form submission
        event.preventDefault();

        const response = await make_request<EditPatrolBody>(`/patrols/${id}`, "PATCH", {
            body: {
                start: patrolData!.start.format("YYYY-MM-DDTHH:mm:ss"),
                end: patrolData!.end ? patrolData!.end.format("YYYY-MM-DDTHH:mm:ss"): null,
                notes: patrolData!.notes === "" ? null: patrolData!.notes
            }
        });

        const responseJson: RequestSuccess = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            return;
        }

        toast.success("Patrulha guardada com sucesso!");
        setEditMode(false);

        // Fetch the details of the patrol again
        setPatrolData(null);
        setPatrolData(await fetchPatrolData(id!));
    }

    const handleDelete = async () => {
        // Make sure the confirmation dialog is closed
        setConfirmDelete(false);

        const response = await make_request(`/patrols/${id}`, "DELETE");
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
        setPatrolData(null);
        onClose();
    }
    
    // * Fetch the patrol data when the component is mounted or the id changes
    useEffect(() => {
        const exec = async () => {
            const patrolData = await fetchPatrolData(id!);

            if (patrolData) {
                setPatrolData(patrolData);
            }
        }

        if (id !== null && open) {
            exec();
        }

        return () => {
            setPatrolData(null);
            setEditMode(false);
        }
    }, [id, open]);

    if (patrolData === null) {
        return (
            <Modal
                width={"50%"}
                open={open}
                title={`Patrulha ${id === null ? "": `#${id!.toUpperCase()}`}`}
                onClose={handleModalClose}
            >
                <Loader size={"100px"}/>
            </Modal>
        )
    }

    return (
        <>
            <Modal
                width={"50%"}
                open={open}
                title={`Patrulha #${id!.toUpperCase()} - ${patrolData.canceled ? "Cancelada": patrolData.end ? "Terminada": "Em curso..."}`}
                onClose={handleModalClose}
            >
                <form onSubmit={handleSave}>
                    <div className={style.mainDiv}>
                        <ModalSection title={"Informações Gerais"}>
                            <div className={style.mainDiv}>
                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo:</DefaultTypography>
                                <DefaultTypography>{patrolData!.type.name}</DefaultTypography>

                                <Divider flexItem sx={{marginBottom: "10px"}} />

                                <Gate show={patrolData!.unit !== null}>
                                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade:</DefaultTypography>
                                    <DefaultTypography>{patrolData!.unit !== null ? `${patrolData!.unit!.name} (${patrolData!.unit.acronym})`: ""}</DefaultTypography>

                                    <Divider flexItem sx={{marginBottom: "10px"}} />
                                </Gate>
                                <div className={style.datesDiv}>
                                    <div className={style.soloDateDiv}>
                                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Início:</DefaultTypography>
                                        <DefaultDateTimePicker
                                            disabled={!editMode}
                                            textWhenDisabled
                                            disableFuture
                                            value={patrolData!.start}
                                            onChange={(date) => setPatrolData(draft => {draft!.start = date!})}
                                            sx={{width: "190px"}}
                                        />
                                    </div>

                                    <div className={style.soloDateDiv}>
                                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Fim:</DefaultTypography>
                                        <DefaultDateTimePicker
                                            disabled={!editMode}
                                            textWhenDisabled
                                            disableFuture
                                            value={patrolData!.end}
                                            onChange={(date) => setPatrolData(draft => {draft!.end = date})}
                                            sx={{width: "190px"}}
                                            slotProps={{
                                                field: {
                                                    clearable: true
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <Divider flexItem sx={{marginBottom: "10px"}} />

                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Observações:</DefaultTypography>

                                <DefaultOutlinedTextField
                                    disabled={!editMode}
                                    fullWidth
                                    textWhenDisabled
                                    placeholder={"Sem observações"}
                                    value={patrolData!.notes}
                                    onChange={(e) => setPatrolData(draft => {draft!.notes = e.target.value})}
                                    multiline
                                />
                            </div>
                        </ModalSection>

                        <ModalSection title={"Membros"}>
                            <div
                                style={{overflowY: "auto"}}
                            >
                                <List
                                    dense
                                    sx={{padding: 0}}
                                >
                                    {patrolData!.officers.map(officer => {
                                        return (
                                            <ListItem
                                                key={`patrolOffice#${officer.nif}`}
                                                sx={{
                                                    padding: "4px 0px"
                                                }}
                                            >
                                                <ListItemText
                                                    sx={{color: "var(--portalseguranca-color-text-light)", margin: 0}}
                                                >
                                                    [{officer.callsign}] {getObjectFromId(officer.patent, getForceData(officer.force).patents)!.name} {officer.name}
                                                </ListItemText>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </div>
                        </ModalSection>

                        <Gate show={patrolData!.editable}>
                            <ModalSection title={"Ações"}>
                                <div className={style.actionsDiv}>
                                    <Gate show={!editMode}>
                                        <DefaultButton
                                            sx={{flex: 1}}
                                            onClick={() => setEditMode(true)}
                                        >
                                            Editar
                                        </DefaultButton>

                                        <DefaultButton
                                            buttonColor={"red"}
                                            sx={{flex: 1}}
                                            onClick={() => setConfirmDelete(true)}
                                        >
                                            Apagar
                                        </DefaultButton>
                                    </Gate>

                                    <Gate show={editMode}>
                                        <DefaultButton
                                            disabled={patrolData!.start.isAfter(patrolData!.end!) || patrolData!.start.isAfter(moment()) || (patrolData!.end ? patrolData!.end.isAfter(moment()): false)}
                                            buttonColor={"lightgreen"}
                                            darkTextOnHover
                                            sx={{flex: 1}}
                                            type={"submit"}
                                        >
                                            Guardar
                                        </DefaultButton>
                                    </Gate>
                                </div>
                            </ModalSection>
                        </Gate>
                    </div>
                </form>
            </Modal>

            <ConfirmationDialog
                open={confirmDelete}
                title={`Apagar Patrulha #${id!}`}
                text={"Tens a certeza que desejas apagar esta patrulha?\n" +
                        "Esta ação não pode ser revertida!"}
                onConfirm={handleDelete}
                onDeny={() => setConfirmDelete(false)}
            />
        </>
    );
}

export default PatrolInfoModal;