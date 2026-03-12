import {Modal} from "../../../../components/Modal";
import {useEffect, useState} from "react";
import {Loader} from "../../../../components/Loader";
import Gate from "../../../../components/Gate/gate.tsx";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {AuditLogData, AuditLogEntryResponse} from "@portalseguranca/api-types/audit-logs/output";
import {toast} from "react-toastify";
import moment, {Moment} from "moment";
import styles from "./styles.module.css";
import {DefaultTypography} from "../../../../components/DefaultComponents";
import {
    ACTIONS_COLORS,
    isTargetOfficer,
    PLACEHOLDER_OFFICER_DATA,
    TRANSLATED_ACTIONS,
    TRANSLATED_MODULES
} from "../../constants.ts";
import {Divider} from "@mui/material";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import OfficerIdentificationText from "../../../../components/OfficerIdentificationText/OfficerIdentificationText.tsx";
import {JsonViewer} from "../../components";

type InnerAuditLogData = Omit<AuditLogData, "timestamp" | "nif" | "target"> & {
    timestamp: Moment
    nif: MinifiedOfficerData
    target: number | MinifiedOfficerData | null
}

type AuditLogModalProps = {
    id: number | null
    open: boolean
    onClose: () => void
}
function AuditLogModal(props: AuditLogModalProps) {
    const [loading, setLoading] = useState<boolean>(true);

    const [details, setDetails] = useState<InnerAuditLogData | null>(null);

    const [ipHidden, setIpHidden] = useState<boolean>(true);

    async function getEntryDetails(showLoading = true, signal?: AbortSignal) {
        if (showLoading) setLoading(true);

        const mainResponse = await make_request(`/audit-logs/${props.id}`, RequestMethod.GET, {signal});
        const mainResponseJson = await mainResponse.json() as AuditLogEntryResponse;

        if (!mainResponse.ok) {
            toast.error(mainResponseJson.message);
            props.onClose();
            return;
        }

        const authorResponse = await make_request(`/officers/${mainResponseJson.data.nif}`, RequestMethod.GET, {signal});
        const authorResponseJson = await authorResponse.json() as OfficerInfoGetResponse;

        let author: MinifiedOfficerData;
        if (!authorResponse.ok) {
            toast.error(authorResponseJson.message);
            author = {
                ...PLACEHOLDER_OFFICER_DATA,
                name: `${PLACEHOLDER_OFFICER_DATA.name} (#${mainResponseJson.data.nif})`
            };
        } else {
            author = authorResponseJson.data;
        }

        let target: number | MinifiedOfficerData | null = mainResponseJson.data.target;

        if (isTargetOfficer(mainResponseJson.data)) {
            const targetResponse = await make_request(`/officers/${mainResponseJson.data.target as number}`, RequestMethod.GET, {signal});
            const targetResponseJson = await targetResponse.json() as OfficerInfoGetResponse;

            if (!targetResponse.ok) {
                target = {
                    ...PLACEHOLDER_OFFICER_DATA,
                    nif: mainResponseJson.data.target as number
                };
            } else {
                target = targetResponseJson.data;
            }
        }

        setDetails({
            ...mainResponseJson.data,
            timestamp: moment.unix(mainResponseJson.data.timestamp),
            nif: author,
            target
        });

        if (showLoading) setLoading(false);
    }

    useEffect(() => {
        const controller = new AbortController();

        if (props.open && props.id !== null) {
            void getEntryDetails(true, controller.signal);
        }

        return () => controller.abort();
    }, [props.open, props.id]);

    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={`Registo #${props.id}`}
            url={`/registo-auditoria/${props.id}`}
        >
            <Gate show={loading}>
                <Loader fullDiv />
            </Gate>

            <Gate show={!loading}>
                <div className={styles.main}>
                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Módulo:</DefaultTypography>
                    <DefaultTypography>{TRANSLATED_MODULES[details?.module ?? 0]}</DefaultTypography>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Ação:</DefaultTypography>
                    <DefaultTypography color={ACTIONS_COLORS[details?.action ?? 0]}>{TRANSLATED_ACTIONS[details?.action ?? 0]}</DefaultTypography>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <Gate show={details?.type !== null}>
                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo:</DefaultTypography>
                        <DefaultTypography>{details?.type}</DefaultTypography>

                        <Divider flexItem sx={{marginBottom: "10px"}} />
                    </Gate>

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Data & Hora:</DefaultTypography>
                    <DefaultTypography>{details?.timestamp.format("DD/MM/YYYY @ HH:mm:ss")}</DefaultTypography>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Utilizador:</DefaultTypography>
                    <OfficerIdentificationText officer={details?.nif ?? PLACEHOLDER_OFFICER_DATA}/>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Endereço IP:</DefaultTypography>
                    <DefaultTypography
                        sx={ipHidden ? {filter: "blur(5px)"} : undefined}
                        clickable
                        onClick={() => setIpHidden(current => !current)}
                    >
                        {details?.ip_address}
                    </DefaultTypography>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <Gate show={details?.target !== null}>
                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Alvo:</DefaultTypography>
                        <Gate show={isTargetOfficer(details ?? {module: "", action: ""})}>
                            <OfficerIdentificationText officer={details?.target as MinifiedOfficerData | null ?? PLACEHOLDER_OFFICER_DATA} showNif/>
                        </Gate>

                        <Gate show={!isTargetOfficer(details ?? {module: "", action: ""})}>
                            <DefaultTypography>{details?.target as number}</DefaultTypography>
                        </Gate>

                        <Divider flexItem sx={{marginBottom: "10px"}} />
                    </Gate>

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Código de estado:</DefaultTypography>
                    <DefaultTypography color={details && details.status_code < 400 ? "green" : (details && details.status_code < 500 ? "yellow" : "red")}>{details?.status_code}</DefaultTypography>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Corpo do Pedido:</DefaultTypography>
                    <JsonViewer value={details?.details}/>

                    <Divider flexItem sx={{marginBottom: "10px"}} />

                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Resposta:</DefaultTypography>
                    <JsonViewer value={details?.response}/>
                </div>
            </Gate>
        </Modal>
    );
}

export default AuditLogModal;