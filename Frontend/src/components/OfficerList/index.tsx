import style from "../PatrolCreator/patrol-creator.module.css";
import {IconButton, List, ListItem, ListItemText} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {DefaultButton} from "../DefaultComponents";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {useContext, useEffect, useState} from "react";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import {useImmer} from "use-immer";
import {OfficerPickerModal} from "../OfficerPicker";
import Gate from "../Gate/gate.tsx";
import OfficerIdentificationText from "../OfficerIdentificationText/OfficerIdentificationText.tsx";

type OfficerListProps = {
    startingOfficers: MinifiedOfficerData[]
    changeCallback: (officers: MinifiedOfficerData[]) => void;
    disabled?: boolean
    invisibleDisabled?: boolean
    enableSelfDelete?: boolean
    preventDelete?: boolean
}
function OfficerList({startingOfficers, changeCallback, disabled, invisibleDisabled, enableSelfDelete, preventDelete}: OfficerListProps) {
    // Get the current logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Controller state
    const [updatedThroughInteraction ,setUpdateThroughInteraction] = useState<boolean>(false);

    // Create state that holds all the officers in the list
    const [officers, setOfficers] = useImmer<MinifiedOfficerData[]>(startingOfficers);

    // Create state to control the officer picker modal
    const [officerPickerModalOpen, setOfficerPickerModalOpen] = useState(false);

    function addOfficer(officer: MinifiedOfficerData) {
        setOfficers((draft) => {
            draft.push(officer)
        });
    }

    // Whenever the officers change, trigger the callback function to update the parent component
    useEffect(() => {
        setUpdateThroughInteraction(true);
        changeCallback(officers);
    }, [JSON.stringify(officers)]);

    // Whenever the "startingOfficers" props changes, update them
    useEffect(() => {
        if (!updatedThroughInteraction) {
            setOfficers(startingOfficers);
        } else {
            setUpdateThroughInteraction(false);
        }

    }, [JSON.stringify(startingOfficers), updatedThroughInteraction]);

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
                                            disabled={(officer.nif === loggedUser.info.personal.nif && !enableSelfDelete) || disabled || preventDelete}
                                            onClick={() => {
                                                setOfficers((draft) => {
                                                    draft.splice(draft.findIndex((off) => off.nif === officer.nif), 1);
                                                });
                                            }}
                                            sx={{
                                                color: "red",
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
                                        <OfficerIdentificationText
                                            officer={officer}
                                            fontSize={"0.9rem"}
                                            showCallsign
                                        />
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
                    return !officers.map((off) => off.nif).includes(officer.nif);
                }}
                keepOpen
            />
        </>
    );
}

export default OfficerList;