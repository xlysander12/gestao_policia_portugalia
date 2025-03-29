import ManagementBar from "../ManagementBar";
import {
    DefaultButton,
    DefaultDateTimePicker,
    DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTypography
} from "../DefaultComponents";
import style from "./patrol-creator.module.css";
import {Divider, MenuItem} from "@mui/material";
import {useForceData} from "../../hooks";
import {PatrolTypeData, SpecialUnitData} from "@portalseguranca/api-types/util/output";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import moment, {Moment} from "moment";
import {useImmer} from "use-immer";
import {getObjectFromId} from "../../forces-data-context.ts";
import {FormEvent, useContext, useState} from "react";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import {make_request} from "../../utils/requests.ts";
import { CreatePatrolBody } from "@portalseguranca/api-types/patrols/input.ts";
import {toast} from "react-toastify";
import OfficerList from "../OfficerList";

type InnerNewPatrolType = {
    type: PatrolTypeData
    special_unit: SpecialUnitData
    officers: MinifiedOfficerData[]
    start: Moment
    end: Moment | null
    notes: string | null
}

function PatrolCreator() {
    // Get the force data from hook
    const [forceData] = useForceData();

    // Get the logged officer from context
    const loggedUser = useContext(LoggedUserContext);

    // Loading state
    const [loading, setLoading] = useState(false);

    // State that holds the patrol information
    const [newPatrolData, setNewPatrolData] = useImmer<InnerNewPatrolType>({
        type: forceData.patrol_types[0],
        special_unit: forceData.special_units[0],
        officers: [{
            name: loggedUser.info.personal.name,
            patent: loggedUser.info.professional.patent.id,
            callsign: loggedUser.info.professional.callsign,
            status: loggedUser.info.professional.status.id,
            nif: loggedUser.info.personal.nif,
            force: localStorage.getItem("force")!
        }],
        start: moment(),
        end: null,
        notes: null
    });

    const createPatrol = async (event: FormEvent) => {
        // Prevent page from realoading
        event.preventDefault();

        // Set the loading state to true
        setLoading(true);

        const response = await make_request<CreatePatrolBody>("/patrols", "POST", {
            body: {
                type: newPatrolData.type.id,
                special_unit: newPatrolData.type.isSpecial ? newPatrolData.special_unit.id: undefined,
                officers: newPatrolData.officers.map((officer) => officer.nif),
                start: newPatrolData.start.unix(),
                end: newPatrolData.end ? newPatrolData.end.unix(): undefined,
                notes: newPatrolData.notes ? newPatrolData.notes: undefined
            }
        });

        const responseJson = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
        } else {
            toast.success("Patrulha criada com sucesso!");
        }

        // Set loading back to false
        setLoading(false);
    }

    return (
        <>
            <ManagementBar>
                <DefaultTypography fontSize={"larger"}>Registar Patrulha</DefaultTypography>
            </ManagementBar>

            <form onSubmit={createPatrol} className={style.informationsDiv}>
                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo de Patrulha:</DefaultTypography>
                <DefaultSelect
                    disabled={loading}
                    value={newPatrolData.type.id}
                    onChange={(event) => {
                        setNewPatrolData((draft) => {
                            draft.type = getObjectFromId(event.target.value as number, forceData.patrol_types)!;
                        });
                    }}
                    sx={{width: "200px"}}
                >
                    {forceData.patrol_types.map((patrolType) => {
                        return (
                            <MenuItem
                                key={`patrolType#${patrolType.id}`}
                                value={patrolType.id}>{patrolType.name}
                            </MenuItem>
                        );
                    })}
                </DefaultSelect>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Unidade Especial:</DefaultTypography>
                <DefaultSelect
                    disabled={!newPatrolData.type.isSpecial || loading}
                    value={newPatrolData.special_unit.id}
                    onChange={(event) => {
                        setNewPatrolData((draft) => {
                            draft.special_unit = getObjectFromId(event.target.value as number, forceData.special_units)!;
                        });
                    }}
                    fullWidth
                >
                    {forceData.special_units.map((unit) => {
                        return (
                            <MenuItem
                                key={`specialUnit#${unit.id}`}
                                value={unit.id}>{unit.name}
                            </MenuItem>
                        );
                    })}
                </DefaultSelect>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <div className={style.datesDiv}>
                    <div>
                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Hora de Início:</DefaultTypography>
                        <DefaultDateTimePicker
                            disabled={loading}
                            disableFuture
                            value={newPatrolData.start}
                            onChange={(date) => {
                                setNewPatrolData((draft) => {
                                    draft.start = date!;
                                });
                            }}
                        />
                    </div>

                    <div>
                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Hora de Fim:</DefaultTypography>
                        <DefaultDateTimePicker
                            disabled={loading}
                            disableFuture
                            clearable
                            value={newPatrolData.end}
                            onChange={(date) => {
                                setNewPatrolData((draft) => {
                                    draft.end = date;
                                });
                            }}
                        />
                    </div>
                </div>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Observações:</DefaultTypography>
                <DefaultOutlinedTextField
                    disabled={loading}
                    multiline
                    fullWidth
                    value={newPatrolData.notes ? newPatrolData.notes : ""}
                    onChange={(event) => {
                        setNewPatrolData((draft) => {
                            draft.notes = event.target.value.trim() !== "" ? event.target.value : null;
                        });
                    }}
                />

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Membros:</DefaultTypography>

                <OfficerList
                    disabled={loading}
                    startingOfficers={newPatrolData.officers}
                    changeCallback={(officers) => {
                        console.log("Callback triggered");
                        setNewPatrolData((draft) => {
                            draft.officers = officers
                        });
                    }}
                />

                <div className={style.registerDiv}>
                    <Divider
                        flexItem
                        sx={{
                            margin: "10px 0",
                            borderColor: "var(--portalseguranca-color-accent)",
                        }}
                    />

                    <DefaultButton
                        disabled={loading}
                        darkTextOnHover
                        fullWidth
                        buttonColor={"lightgreen"}
                        type={"submit"}
                    >
                        Registar Patrulha
                    </DefaultButton>
                </div>
            </form>
        </>
    );
}

export default PatrolCreator;