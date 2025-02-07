import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {PatrolData, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import moment, { Moment } from "moment";
import {useImmer} from "use-immer";
import {make_request} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import {useEffect, useState} from "react";
import {Modal, ModalSection} from "../../../../components/Modal";
import Loader from "../../../../components/Loader/loader.tsx";
import Gate from "../../../../components/Gate/gate.tsx";
import style from "./patrol-info-modal.module.css"
import {DefaultTypography} from "../../../../components/DefaultComponents";
import {useForceData} from "../../../../hooks";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {Divider} from "@mui/material";
import {PatrolTypeData, SpecialUnitData} from "@portalseguranca/api-types/util/output";

type InnerOfficerData = MinifiedOfficerData & {
    force: string
}

type InnerPatrolData = Omit<PatrolData, "start" | "end" | "officers" | "type" | "unit"> & {
    type: PatrolTypeData
    unit: SpecialUnitData | null
    start: Moment
    end: Moment | null
    officers: InnerOfficerData[]
}

type PatrolInfoModalProps = {
    open: boolean
    onClose: () => void
    id: string | null
}

function PatrolInfoModal({open, onClose, id}: PatrolInfoModalProps) {
    const [forceData, getForceData] = useForceData();
    
    const [patrolData, setPatrolData] = useImmer<InnerPatrolData | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);

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
            unit: responseJson.data.unit ? getObjectFromId(responseJson.data.unit, getForceData(patrolForce).special_units)! : null
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
        }
    }, [id, open]);

    if (patrolData === null) {
        return (
            <Modal open={open} title={`Patrulha ${id === null ? "": `#${id!.toUpperCase()}`}`} onClose={handleModalClose}>
                <Loader size={"100px"}/>
            </Modal>
        )
    }

    return (
        <>
            <Modal open={open} title={`Patrulha #${id!.toUpperCase()} - ${patrolData.canceled ? "Cancelada": patrolData.end ? "Terminada": "Em curso..."}`} onClose={handleModalClose}>
                <div className={style.mainDiv}>
                    <ModalSection title={"Informações"}>
                        <div className={style.mainDiv}>
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo:</DefaultTypography>
                            <DefaultTypography>{patrolData!.type.name}</DefaultTypography>

                            <Divider flexItem sx={{marginBottom: "10px"}} />

                            <Gate show={patrolData!.unit !== null}>
                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade:</DefaultTypography>
                                <DefaultTypography>{patrolData!.unit !== null ? `${patrolData!.unit!.name} (${patrolData!.unit.acronym})`: ""}</DefaultTypography>

                                <Divider flexItem sx={{marginBottom: "10px"}} />
                            </Gate>
                            {/*TODO: Start and End should be side by side*/}
                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Início:</DefaultTypography>
                            <DefaultTypography>{patrolData!.start.format("DD/MM/YYYY HH:mm")}</DefaultTypography>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Fim:</DefaultTypography>
                            <DefaultTypography>{patrolData!.end ? patrolData.end.format("DD/MM/YYYY HH:mm"): "Em curso..."}</DefaultTypography>
                        </div>
                    </ModalSection>
                </div>
            </Modal>
        </>
    );
}

export default PatrolInfoModal;