import {useContext, useEffect, useState} from "react";
import {
    OfficerJustification,
    OfficerJustificationDetailsResponse
} from "@portalseguranca/api-types/officers/activity/output";
import {toast} from "react-toastify";
import {Modal, ModalSection} from "../../../../components/Modal/modal.tsx";
import {make_request} from "../../../../utils/requests.ts";
import Gate from "../../../../components/Gate/gate.tsx";
import Loader from "../../../../components/Loader/loader.tsx";
import {ForceDataContext} from "../../../../force-data-context.ts";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import { RequestError } from "@portalseguranca/api-types/index.ts";
import style from "./index.module.css";
import {Checkbox, Divider, FormControlLabel, MenuItem, Typography} from "@mui/material";
import {DefaultSelect, DefaultTextField} from "../../../../components/DefaultComponents";
import {useImmer} from "use-immer";
import ScreenSplit from "../../../../components/ScreenSplit/screen-split.tsx";

type InactivityJustificationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: number,
    justificationId: number,
}
function InactivityJustificationModal({open, onClose, officerNif, justificationId}: InactivityJustificationModalProps) {
    // Get the force data from context
    const forceData = useContext(ForceDataContext);

    // Get the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Set the loading state
    const [loading, setLoading] = useState(true);

    // Set the editmode state
    const [editMode, setEditMode] = useState<boolean>(false);

    // Set the state with the data of the justification
    const [justificationData, setJustificationData] = useImmer<OfficerJustification | null>(null);

    // Everytime the justificationId changes and the modal is opened, fetch the justification data
    useEffect(() => {
        const fetchJustificationData = async () => {
            // Set the loading to true
            setLoading(true);

            // Fetch the data from the API
            const response = await make_request(`/officers/${officerNif}/activity/justifications/${justificationId}`, "GET");

            // Parse the response
            const data: RequestError | OfficerJustificationDetailsResponse = await response.json();

            // Handle possible error
            if (!response.ok) {
                toast(data.message, {type: "error"});
                return;
            }

            // Set the justification data
            setJustificationData((data as OfficerJustificationDetailsResponse).data);

            // Disable loading
            setLoading(false);
        }

        if (open) {
            fetchJustificationData();
        }
    }, [justificationId, open]);

    return (
        <Modal open={open} onClose={onClose} title={`Justificação de Inatividade #${justificationId}`}>
            <>
                <Gate show={loading}>
                    <Loader size={"100px"} />
                </Gate>

                <Gate show={!loading}>
                    <ModalSection title={"Detalhes"}>
                        <div className={style.justificationDetailsOuterDiv}>
                            {/* Status */}
                            <Typography
                                color={"var(--portalseguranca-color-accent)"}
                                fontSize={"medium"}
                                fontWeight={"bold"}
                            >Estado:
                            </Typography>
                            <Typography
                                color={justificationData?.status === "pending" ? "#efc032" : justificationData?.status === "approved" ? "#00ff00" : "#ff0000"}
                                sx={{marginBottom: "10px"}}
                            >
                                {justificationData?.status === "pending" ? "Pendente" : justificationData?.status === "approved" ? "Aprovada" : "Rejeitada"}
                            </Typography>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            {/* Type */}
                            <Typography
                                color={"var(--portalseguranca-color-accent)"}
                                fontSize={"medium"}
                                fontWeight={"bold"}
                            >
                                Tipo de Inatividade:
                            </Typography>
                            <DefaultSelect
                                disabled={!editMode}
                                sameTextColorWhenDisabled
                                value={justificationData?.type}
                                onChange={(e) => {
                                    setJustificationData((draft) => {
                                        draft!.type = e.target.value as number;
                                    });
                                }}
                                sx={{minWidth: "152px", textAlign: "start", marginBottom: "10px"}}
                            >
                                {forceData.inactivity_types.map((type) => {
                                    return (
                                        <MenuItem
                                            key={`modalInactivityType${type.id}`}
                                            value={type.id}
                                        >
                                            {type.name}
                                        </MenuItem>
                                    )
                                })};
                            </DefaultSelect>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            {/* Duration */}
                            <div style={{width: "100%", marginBottom: "10px"}}>
                                <ScreenSplit leftSideComponent={
                                    // Start Date
                                    <div className={style.justificationDetailsDurationStartDiv}>
                                        <Typography
                                            color={"var(--portalseguranca-color-accent)"}
                                            fontSize={"medium"}
                                            fontWeight={"bold"}
                                        >
                                            Data de Início:
                                        </Typography>
                                        <DefaultTextField
                                            disabled={!editMode}
                                            sameTextColorWhenDisabled
                                            type={"date"}
                                            value={justificationData?.start}
                                        />
                                    </div>
                                } leftSidePercentage={50}>
                                    {/* End Date */}
                                    <div className={style.justificationDetailsDurationEndDiv}>
                                        <Typography
                                            color={"var(--portalseguranca-color-accent)"}
                                            fontSize={"medium"}
                                            fontWeight={"bold"}
                                            sx={{marginRight: "38px"}}
                                        >
                                            Data de Fim:
                                        </Typography>
                                        <DefaultTextField
                                            disabled={!editMode}
                                            sameTextColorWhenDisabled
                                            type={"date"}
                                            value={justificationData?.end}
                                        />
                                    </div>
                                </ScreenSplit>

                                <div className={style.justificationDetailsDurationEndDiv} style={{width: "100%"}}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={justificationData?.end === null}
                                                onChange={(e) => {
                                                    setJustificationData((draft) => {
                                                        draft!.end = e.target.checked ? null : new Date().toISOString().split("T")[0];
                                                    });
                                                }}
                                                disabled={!editMode}
                                                sx={{
                                                    "&.MuiCheckbox-root.Mui-disabled": {
                                                        color: "var(--portalseguranca-color-accent)"
                                                    }
                                                }}
                                            />
                                        }
                                        label={"Indeterminada"}
                                        sx={{marginRight: "4px", color: "var(--portalseguranca-color-text-light)",
                                            "& .MuiFormControlLabel-label.Mui-disabled": {
                                                color: "var(--portalseguranca-color-text-light)"
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <Divider flexItem sx={{marginBottom: "5px"}}/>

                            {/* Description */}
                            <Typography
                                color={"var(--portalseguranca-color-accent)"}
                                fontSize={"medium"}
                                fontWeight={"bold"}
                            >
                                Descrição:
                            </Typography>
                            <DefaultTextField
                                disabled={!editMode}
                                sameTextColorWhenDisabled
                                multiline
                                value={justificationData?.description}
                                onChange={(e) => {
                                    setJustificationData((draft) => {
                                        draft!.description = e.target.value;
                                    });
                                }}
                                sx={{width: "100%", marginBottom: "10px"}}
                            />
                        </div>
                    </ModalSection>

                    <Gate show={loggedUser.intents["activity"] || (justificationData !== null && justificationData.status === "pending")}>
                        <ModalSection title={"Ações"}>
                            <></>
                        </ModalSection>
                    </Gate>
                </Gate>
            </>
        </Modal>
    )
}

export default InactivityJustificationModal;