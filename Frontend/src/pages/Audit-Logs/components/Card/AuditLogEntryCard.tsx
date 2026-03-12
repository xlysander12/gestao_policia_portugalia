import {InnerMinifiedAuditLogData} from "../../Audit-Logs.tsx";
import InformationCard from "../../../../components/InformationCard";
import styles from "./styles.module.css";
import {DefaultTypography} from "../../../../components/DefaultComponents";
import {useEffect, useMemo, useState} from "react";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {MODULE} from "@portalseguranca/api-types";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {useForceData} from "../../../../hooks";
import Gate from "../../../../components/Gate/gate.tsx";
import {Skeleton} from "@mui/material";
import {ACTIONS_COLORS, isTargetOfficer, PLACEHOLDER_OFFICER_DATA} from "../../constants.ts";

type AuditLogEntryCardProps = {
    entry: InnerMinifiedAuditLogData
    callback: (entry: InnerMinifiedAuditLogData) => void
}
function AuditLogEntryCard(props: AuditLogEntryCardProps) {
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(true);

    const [officers, setOfficers] = useState<(MinifiedOfficerData | null)[]>([]);


    async function fetchOfficerData(nif: number, signal?: AbortSignal): Promise<MinifiedOfficerData> {
        const response = await make_request(`/officers/${nif}`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as OfficerInfoGetResponse;

        if (!response.ok) {
            return {
                ...PLACEHOLDER_OFFICER_DATA,
                name: `${PLACEHOLDER_OFFICER_DATA.name} (#${nif})`
            };
        }

        return responseJson.data;
    }

    async function buildOfficersData(showLoading = true, signal?: AbortSignal) {
        // Inner function to fetch the author's data
        async function fetchAuthorData(signal?: AbortSignal) {
            return await fetchOfficerData(props.entry.nif, signal);
        }

        // Inner function to fetch the target's data
        async function fetchTargetData(signal?: AbortSignal) {
            if (!isTargetOfficer(props.entry)) return null;
            return await fetchOfficerData(props.entry.target!, signal);
        }

        if (showLoading) setLoading(true);

        setOfficers(await Promise.all([fetchAuthorData(signal), fetchTargetData(signal)]));

        if (showLoading) setLoading(false);
    }

    function handleClick() {
        props.callback(props.entry);
    }

    const title = useMemo(() => {
        if (loading) return null;
        let builder = "";

        // First, start with the officer's patent and name
        builder += `${getObjectFromId(officers[0]!.patent, forceData.patents)!.name} ${officers[0]!.name}`;

        // Then, add the action performed
        switch (props.entry.action) {
            case "add":
                if (props.entry.status_code < 400) {
                    builder += " criou";
                } else {
                    builder += " tentou criar";
                }
                break;
            case "delete":
                if (props.entry.status_code < 400) {
                    builder += " eliminou";
                } else {
                    builder += " tentou eliminar";
                }
                break;
            case "update":
                if (props.entry.status_code < 400) {
                    builder += " modificou";
                } else {
                    builder += " tentou modificar";
                }
                break;
            case "restore":
                if (props.entry.status_code < 400) {
                    builder += " restaurou";
                } else {
                    builder += " tentou restaurar";
                }
                break;
            case "manage":
                if (props.entry.status_code < 400) {
                    builder += " geriu";
                } else {
                    builder += " tentou gerir";
                }
                break;
            default:
                builder += ` realizou a ação ${props.entry.action}`;
                break;
        }

        // Then, add the module on which the action was performed
        switch (props.entry.module as MODULE) {
            case MODULE.ACCOUNTS:
                if (props.entry.type === "password_change") {
                    builder += " a sua senha";
                    break;
                }

                if (props.entry.type === "password_reset") {
                    builder += " a senha de";
                    break;
                }

                builder += " a conta de";
                break;
            case MODULE.OFFICERS:
                builder += " o efetivo";
                break;
            case MODULE.ACTIVITY:
                switch (props.entry.type) {
                    case "last_date":
                        builder += " uma última data de";
                        break;
                    case "hours":
                        if (props.entry.action === "add") {
                            builder += " um registo de horas de";
                        } else {
                            builder += " o registo de horas";
                        }

                        break;
                    case "justification":
                        if (props.entry.action === "add") {
                            builder += " uma justificação de";
                        } else {
                            builder += " a justificação";
                        }
                        break;
                    default:
                        builder += " um registo de atividade de";
                        break;
                }
                break;
            case MODULE.PATROLS:
                if (props.entry.action === "add" && props.entry.status_code >= 400) {
                    builder += " uma patrulha";
                    break;
                } else {
                    builder += " a patrulha";
                }
                break;
            case MODULE.EVALUATIONS:
                if (props.entry.action === "add") {
                    builder += " uma avaliação sobre";
                    break;
                }
                builder += " a avaliação";
                break;
            case MODULE.CEREMONY_DECISIONS:
                builder += " a decisão de cerimónia";
                break;
            case MODULE.EVENTS:
                builder += " o evento";
                break;
            case MODULE.ANNOUNCEMENTS:
                builder += " o anúncio";
                break;
            default:
                builder += ` (no módulo ${props.entry.module})`;
                break;
        }

        // If the module is ACCOUNT and the type is "password_change", don't add anything else
        // Additionally, if the module is EVENTS or PATROLS or ANNOUNCEMENTS, the action is "add" and it wasn't successul, don't add anything else
        if (
            (props.entry.module as MODULE === MODULE.ACCOUNTS && props.entry.type === "password_change") ||
            (
                (
                    props.entry.module as MODULE === MODULE.EVENTS ||
                    props.entry.module as MODULE === MODULE.PATROLS ||
                    props.entry.module as MODULE === MODULE.ANNOUNCEMENTS
                ) && props.entry.action === "add" && props.entry.status_code >= 400
            )
        ) {
            return builder;
        }

        /* Finally, if the target is an officer, add their name as well
         ** Conditions for this to be true:
         ** - The module must be either OFFICERS or ACCOUNTS (since accounts are also officers)
         ** - The module is ACTIVITY, but the action is "add"
         */
        if (isTargetOfficer(props.entry)) {
            builder += ` ${officers[1] ? `${getObjectFromId(officers[1].patent, forceData.patents)!.name} ${officers[1].name}` : props.entry.target}`;
        } else { // If not, just add the target's ID
            builder += ` #${props.entry.target}`;
        }

        return builder;
    }, [loading, JSON.stringify(officers), props.entry.action, props.entry.module, props.entry.target, JSON.stringify(forceData)]);

    useEffect(() => {
        const controller = new AbortController();

        void buildOfficersData(true, controller.signal);

        return () => controller.abort();
    }, []);

    return (
        <InformationCard callback={handleClick} statusColor={ACTIONS_COLORS[props.entry.action]}>
            <div className={styles.main}>
                <div className={styles.left}>
                    <Gate show={loading}>
                        <Skeleton variant={"text"} />
                    </Gate>
                    <Gate show={!loading}>
                        <DefaultTypography fontSize={"normal"}>
                            {title}
                        </DefaultTypography>
                    </Gate>
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "5px"
                    }}>
                        <DefaultTypography color={"gray"}>Sucesso: </DefaultTypography>
                        <DefaultTypography color={props.entry.status_code < 400 ? "green" : "red"}>
                            {props.entry.status_code < 400 ? "Sim" : "Não"}
                        </DefaultTypography>
                    </div>

                </div>
                <div className={styles.right}>
                    <DefaultTypography color={"gray"} fontSize={"small"}>
                        {props.entry.timestamp.calendar()}
                    </DefaultTypography>
                </div>
            </div>
        </InformationCard>
    );
}

export default AuditLogEntryCard;