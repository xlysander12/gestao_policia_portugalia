import {Modal, ModalSection} from "../../Modal";
import {DefaultPagination, DefaultTypography} from "../../DefaultComponents";
import {useContext, useEffect, useState} from "react";
import {make_request} from "../../../utils/requests.ts";
import {AuditLogEntry, AuditLogResponse} from "@portalseguranca/api-types/util/output";
import {toast} from "react-toastify";
import {Chip, CircularProgress, Divider, Tooltip} from "@mui/material";
import moment from "moment";
import {LoggedUserContext} from "../../PrivateRoute/logged-user-context.ts";

// Map module names to more readable labels (Portuguese)
const MODULE_LABELS: Record<string, string> = {
    accounts: "Contas",
    officers: "Efetivos",
    activity: "Atividade",
    patrols: "Patrulhas",
    evaluations: "Avaliações",
    ceremony_decisions: "Decisões de Cerimónia",
    events: "Eventos",
    announcements: "Avisos"
};

// Map action names to readable labels and colors
const ACTION_CONFIG: Record<string, { label: string; color: "success" | "warning" | "error" | "info" | "default" }> = {
    add: {label: "Adicionar", color: "success"},
    update: {label: "Atualizar", color: "info"},
    delete: {label: "Eliminar", color: "error"},
    restore: {label: "Restaurar", color: "warning"},
    manage: {label: "Gerir", color: "default"}
};

type AuditLogModalProps = {
    open: boolean;
    onClose: () => void;
};

function AuditLogModal({open, onClose}: AuditLogModalProps) {
    const loggedUser = useContext(LoggedUserContext);

    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);

    async function fetchAuditLog(targetPage: number) {
        setLoading(true);

        const response = await make_request("/util/audit-log", "GET", {
            queryParams: [{key: "page", value: String(targetPage)}]
        });

        if (!response.ok) {
            toast.error("Erro ao carregar o registo de atividade.");
            setLoading(false);
            return;
        }

        const json = await response.json() as AuditLogResponse;
        setEntries(json.data.entries);
        setTotalPages(json.data.totalPages);
        setLoading(false);
    }

    useEffect(() => {
        if (open) {
            void fetchAuditLog(page);
        }
    }, [open, page]);

    function handlePageChange(_: unknown, newPage: number) {
        setPage(newPage);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={"Registo de Auditoria"}
            width={"55%"}
        >
            <ModalSection title={"Atividade"}>
                {loading ? (
                    <div style={{display: "flex", justifyContent: "center", padding: "20px"}}>
                        <CircularProgress />
                    </div>
                ) : entries.length === 0 ? (
                    <DefaultTypography color={"gray"}>Nenhum registo encontrado.</DefaultTypography>
                ) : (
                    <>
                        <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                            {entries.map(entry => {
                                const actionConfig = ACTION_CONFIG[entry.action] ?? {label: entry.action, color: "default"};
                                const moduleLabel = MODULE_LABELS[entry.module] ?? entry.module;

                                return (
                                    <div
                                        key={entry.id}
                                        style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "6px 8px",
                                            borderRadius: "4px",
                                            backgroundColor: "var(--portalseguranca-color-background-light)"
                                        }}
                                    >
                                        {/* Timestamp */}
                                        <Tooltip title={moment.unix(entry.timestamp).format("DD/MM/YYYY HH:mm:ss")}>
                                            <DefaultTypography
                                                color={"gray"}
                                                fontSize={"small"}
                                                style={{minWidth: "130px", flexShrink: 0}}
                                            >
                                                {moment.unix(entry.timestamp).format("DD/MM/YYYY HH:mm")}
                                            </DefaultTypography>
                                        </Tooltip>

                                        <Divider orientation={"vertical"} flexItem />

                                        {/* Author */}
                                        <DefaultTypography
                                            fontSize={"small"}
                                            style={{minWidth: "80px", flexShrink: 0}}
                                        >
                                            {entry.author === loggedUser.info.personal.nif ? "Você" : `NIF ${entry.author}`}
                                        </DefaultTypography>

                                        <Divider orientation={"vertical"} flexItem />

                                        {/* Module */}
                                        <DefaultTypography
                                            fontSize={"small"}
                                            style={{minWidth: "120px", flexShrink: 0}}
                                        >
                                            {moduleLabel}
                                        </DefaultTypography>

                                        <Divider orientation={"vertical"} flexItem />

                                        {/* Action chip */}
                                        <Chip
                                            label={actionConfig.label}
                                            color={actionConfig.color}
                                            size={"small"}
                                            style={{flexShrink: 0}}
                                        />

                                        {/* Details */}
                                        {entry.details && Object.keys(entry.details).length > 0 && (
                                            <>
                                                <Divider orientation={"vertical"} flexItem />
                                                <DefaultTypography
                                                    color={"gray"}
                                                    fontSize={"x-small"}
                                                    style={{wordBreak: "break-all"}}
                                                >
                                                    {Object.entries(entry.details)
                                                        .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")
                                                        .map(([k, v]) => `${k}: ${String(v)}`)
                                                        .join(" · ")}
                                                </DefaultTypography>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div style={{display: "flex", justifyContent: "center", marginTop: "12px"}}>
                                <DefaultPagination
                                    count={totalPages}
                                    page={page}
                                    onChange={handlePageChange}
                                    lightBackground
                                />
                            </div>
                        )}
                    </>
                )}
            </ModalSection>
        </Modal>
    );
}

export default AuditLogModal;
