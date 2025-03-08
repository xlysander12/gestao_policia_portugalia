import style from "../PatrolCreator/patrol-creator.module.css";
import {IconButton, List, ListItem, ListItemText} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {DefaultButton, DefaultTypography} from "../DefaultComponents";
import {getObjectFromId} from "../../forces-data-context.ts";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import {useForceData} from "../../hooks";
import {useImmer} from "use-immer";
import {OfficerPickerModal} from "../OfficerPicker";
import Gate from "../Gate/gate.tsx";

type OfficerListProps = {
    startingOfficers: MinifiedOfficerData[]
    changeCallback: (officers: MinifiedOfficerData[]) => void;
    disabled?: boolean
    invisibleDisabled?: boolean
}
function OfficerList({startingOfficers, changeCallback, disabled, invisibleDisabled}: OfficerListProps) {
    // Get the current logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Get force data from context
    const [, getForceData] = useForceData();

    // Create state that holds all the officers in the list
    const [officers, setOfficers] = useImmer<MinifiedOfficerData[]>(startingOfficers);

    // Create state to control the officer picker modal
    const [officerPickerModalOpen, setOfficerPickerModalOpen] = useState(false);

    function addOfficer(officer: MinifiedOfficerData) {
        setOfficers((draft) => {
            draft.push(officer)
        });

        // Close the officer picker modal
        setOfficerPickerModalOpen(false);
    }

    // Whenever the officers change, trigger the callback function to update the parent component
    useEffect(() => {
        changeCallback(officers);
    }, [officers.length]);

    return (
        <>
            <div className={style.membersDiv}>
                <List
                    dense
                    sx={invisibleDisabled ? {
                        padding: 0
                    }: {}}
                >
                    {officers.map((officer) => {
                        return (
                            <ListItem
                                key={`officerListOfficer#${officer.nif}`}
                                secondaryAction={
                                    <Gate show={!invisibleDisabled}>
                                        <IconButton
                                            disabled={officer.nif === loggedUser.info.personal.nif || disabled}
                                            onClick={() => {
                                                setOfficers((draft) => {
                                                    draft.splice(draft.findIndex((off) => off.nif === officer.nif), 1);
                                                });
                                            }}
                                            sx={{
                                                color: "red", // TODO: Ask if it looks better white or red
                                                marginRight: "-10px"
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Gate>
                                }
                                sx={invisibleDisabled ? {
                                    paddingTop: 0,
                                    paddingBottom: 0
                                }: {}}
                            >
                                <ListItemText
                                    primary={
                                        <DefaultTypography
                                            fontSize={"0.9rem"}
                                        >
                                            [{officer.callsign}] {getObjectFromId(officer.patent, getForceData(officer.force!).patents)!.name} {officer.name}
                                        </DefaultTypography>
                                    }
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </div>

            <Gate show={!invisibleDisabled}>
                <DefaultButton
                    disabled={disabled}
                    fullWidth
                    darkTextOnHover
                    buttonColor={"lightgreen"}
                    onClick={() => setOfficerPickerModalOpen(true)}
                >
                    Adicionar Efetivo
                </DefaultButton>
            </Gate>

            <OfficerPickerModal
                patrol
                open={officerPickerModalOpen}
                onClose={() => setOfficerPickerModalOpen(false)}
                callback={addOfficer}
                filter={(officer) => {
                    if (officers.map((off) => off.nif).includes(officer.nif)) {
                        return false;
                    }

                    // Checking if the officer has a status that prevents from doing patrols
                    const officerStatus = getObjectFromId(officer.status, getForceData(officer.force!).statuses);

                    return officerStatus!.canPatrol;
                }}
            />
        </>
    );
}

export default OfficerList;