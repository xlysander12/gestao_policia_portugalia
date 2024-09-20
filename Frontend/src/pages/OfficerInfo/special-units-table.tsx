import {
    MenuItem,
    Select,
    Table, TableBody,
    TableCell,
    TableContainer, TableFooter,
    TableHead,
    TableRow
} from "@mui/material";
import React, {useContext} from "react";
import {DefaultButton} from "../../components/DefaultComponents";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
    ForceDataContext,
    ForceDataContextType,
    getSpecialUnitFromId,
    SpecialUnit,
    SpecialUnitRole
} from "../../force-data-context.ts";
import {OfficerUnit} from "@portalseguranca/api-types/officers/output";
import {useImmer} from "use-immer";
import Gate from "../../components/Gate/gate.tsx";

const TableSelectStyle = {
    "& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input": {
        paddingRight: "32px !important",

        "&, &.Mui-disabled": {
            WebkitTextFillColor: "#d0c7d3",
        },

        "&.Mui-disabled": {
            paddingRight: "14px !important"
        },

        "&.MuiSelect-select": {
            textAlign: "center",
            whiteSpace: "normal"
        },

        padding: "1px 14px 1px 0",
    },

    "& .MuiOutlinedInput-notchedOutline": {
        display: "none"
    },

    "& .MuiSvgIcon-root.MuiSelect-icon": {
        color: "#d0c7d3",

        "&.Mui-disabled": {
            display: "none"
        }
    }
}

type SpecialUnitsTableRowProps = {
    selectSx: any,
    unit: OfficerUnit,
    unitName: string,
    unitRoles: any,
    editMode: boolean,
    onChange: ((unit: OfficerUnit) => void),
    onRemove: ((unit: OfficerUnit) => void)
}
const SpecialUnitsTableRow = ({selectSx, unit, unitName, unitRoles, editMode, onChange, onRemove}: SpecialUnitsTableRowProps) => {
    return (
        <TableRow
            key={`unitstableunit#${unit.id}`}
            sx={!editMode ? {'&:last-child td, &:last-child th': { border: 0 }}: {'&:last-child td, &:last-child th': { borderColor: "var(--portalseguranca-color-accent)" }}}
        >
            <TableCell sx={{color: "var(--portalseguranca-color-text-light)"}}>{unitName}</TableCell>
            <TableCell>
                <Select
                    value={String(unit.role)}
                    disabled={!editMode}
                    onChange={(event) => onChange({id: unit.id, role: Number(event.target.value)})}
                    fullWidth
                    sx={selectSx}
                    variant={"outlined"}
                >
                    {unitRoles.map((role: SpecialUnit) => {
                        return (
                            <MenuItem key={`role${role.id}`} value={role.id}>{role.name}</MenuItem>
                        )
                    })}
                </Select>
            </TableCell>
            <Gate show={editMode}>
                <TableCell>
                    <DefaultButton buttonColor={"red"} size={"small"} sx={{minWidth: "32px", padding: "3px"}} onClick={() => onRemove(unit)}><RemoveIcon fontSize={"small"} /></DefaultButton>
                </TableCell>
            </Gate>
        </TableRow>
    )
}

type SpecialUnitsFooterProps = {
    officerSpecialUnits: OfficerUnit[]
    onAdd: (unit: OfficerUnit) => void
}
const SpecialUnitsFooter = ({officerSpecialUnits, onAdd}: SpecialUnitsFooterProps) => {
    const SelectSx = {
        "& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input": {
            paddingRight: "32px !important",

            "&, &.Mui-disabled": {
                WebkitTextFillColor: "#d0c7d3",
            },

            "&.Mui-disabled": {
                paddingRight: "14px !important"
            },

            "&.MuiSelect-select": {
                textAlign: "left",
                whiteSpace: "normal"
            },

            padding: "1px 14px 1px 0",
        },

        "& .MuiOutlinedInput-notchedOutline": {
            display: "none"
        },

        "& .MuiSvgIcon-root.MuiSelect-icon": {
            color: "#d0c7d3",

            "&.Mui-disabled": {
                display: "none"
            }
        }
    }

    // Getting the special forces and their roles from the force data context
    const forceData: ForceDataContextType = useContext(ForceDataContext);
    const specialUnits = forceData.special_units;
    const specialUnitsRoles = forceData.special_unit_roles;

    // Array that will hold all special units the officer isn't a part of
    let availableSpecialUnits: SpecialUnit[] = [];
    for (const unit of specialUnits) {
        let isPartOf = false;
        for (const officerUnit of officerSpecialUnits) {
            if (unit.id === officerUnit.id) {
                isPartOf = true;
                break;
            }
        }
        if (!isPartOf) {
            availableSpecialUnits.push(unit);
        }
    }

    // Initializing state with the current "adding" special unit
    const [newUnit, setNewUnit] = useImmer<OfficerUnit>({id: availableSpecialUnits[0].id, role: 0});

    return (
        <TableFooter>
            <TableRow>
                {/*Select to change Unit*/}
                <TableCell align={"left"}>
                    <Select
                        fullWidth
                        sx={SelectSx}
                        variant={"outlined"}
                        value={newUnit.id}
                        onChange={(event) => {
                            setNewUnit(draft => {
                                draft.id = Number(event.target.value);
                            });
                        }}
                    >
                        {availableSpecialUnits.map((unit: SpecialUnit) => {
                            return (
                                <MenuItem key={`newUnit${unit.id}`} value={unit.id}>{unit.name}</MenuItem>
                            )
                        })}
                    </Select>
                </TableCell>

                {/*Select to change role*/}
                <TableCell align={"center"}>
                    <Select
                        fullWidth
                        sx={TableSelectStyle}
                        variant={"outlined"}
                        value={newUnit.role}
                        onChange={(event) => {
                            setNewUnit(draft => {
                                draft.role = Number(event.target.value);
                            });
                        }}
                    >
                        {specialUnitsRoles.map((role: SpecialUnitRole) => {
                            return (
                                <MenuItem key={`newUniRole${role.id}`} value={role.id}>{role.name}</MenuItem>
                            )
                        })}
                    </Select>
                </TableCell>

                {/*Button to commit addition*/}
                <TableCell align={"center"}>
                    <DefaultButton buttonColor={"lightgreen"} size={"small"} sx={{minWidth: "32px", padding: "3px"}} onClick={() => {onAdd(newUnit)}}><AddIcon fontSize={"small"}/></DefaultButton>
                </TableCell>
            </TableRow>
        </TableFooter>
    )
}

type SpecialUnitsTableProps = {
    editMode: boolean,
    officerSpecialUnits: OfficerUnit[],
    onChange: ((unit: OfficerUnit) => void),
    onRemove: ((unit: OfficerUnit) => void),
    onAdd: ((unit: OfficerUnit) => void)
}
const SpecialUnitsTable = ({editMode, officerSpecialUnits, onChange, onRemove, onAdd}: SpecialUnitsTableProps) => {
    // Getting the special forces and their roles from the force data context
    const forceData: ForceDataContextType = useContext(ForceDataContext);
    const specialUnits = forceData.special_units;
    const specialUnitsRoles = forceData.special_unit_roles;

    return (
        <TableContainer>
            <Table size={"small"} padding={"normal"}>
                <TableHead>
                    <TableRow>
                        <TableCell align={"center"} sx={{color: "var(--portalseguranca-color-text-light)"}}>Unidade</TableCell>
                        <TableCell align={"center"} sx={{color: "var(--portalseguranca-color-text-light)"}}>Cargo</TableCell>
                        <Gate show={editMode}>
                            <TableCell align={"center"} sx={{color: "var(--portalseguranca-color-text-light)"}}>Ação</TableCell>
                        </Gate>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/*Cycle through all units of the officer and display it's roles*/}
                    {officerSpecialUnits.map((unit: OfficerUnit) => {
                        return (
                            <SpecialUnitsTableRow
                                selectSx={TableSelectStyle}
                                unit={unit}
                                unitName={getSpecialUnitFromId(unit.id, specialUnits)!.name}
                                unitRoles={specialUnitsRoles}
                                editMode={editMode}
                                onChange={onChange}
                                onRemove={onRemove}
                            />
                        );
                    })}
                </TableBody>
                <Gate show={editMode}>
                    <SpecialUnitsFooter officerSpecialUnits={officerSpecialUnits} onAdd={onAdd} />
                </Gate>
            </Table>
        </TableContainer>
    )
}

export default SpecialUnitsTable;