import React, {ChangeEvent, ReactElement, useContext, useEffect, useState} from "react";
import style from "./officerinfo.module.css";
import modalsStyle from "./officerinfomodals.module.css";
import OfficerList from "../../components/OfficerList/officer-list";
import Loader from "../../components/Loader/loader";
import {Modal, ModalSection} from "../../components/Modal/modal";
import {make_request} from "../../utils/requests";
import {BASE_URL} from "../../utils/constants";
import {
    Button,
    Divider,
    FormControlLabel,
    MenuItem,
    Select, SelectChangeEvent,
    Switch, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow,
    TextField,
} from "@mui/material";
import {styled} from  "@mui/material/styles"
import ScreenSplit from "../../components/ScreenSplit/screen-split";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import {createSearchParams, useNavigate} from "react-router-dom";

const OfficerInfoSelectSlotProps = {
    root: {
        sx: {
            "label+&": {
                margin: 0
            },

            "&:before": {
                borderBottom: "3px solid #049985"
            },

            "&:hover:not(.Mui-disabled, .Mui.error):before": {
                borderBottom: "3px solid #049985"
            },

            "&.Mui-disabled:before": {
                border: 0
            },

            "&:after": {
                borderBottom: "3px solid #00fdfd"
            },
        }
    }
}

const StyledSelect = styled(Select)(() => ({
    "& .MuiSelect-icon": {
        color: "#049985",

        "&.Mui-disabled": {
            display: "none",
        },
    },

    "& .MuiInput-input": {
        fontWeight: 500,
        WebkitTextFillColor: "#d0c7d3",

        "&.Mui-disabled": {
            WebkitTextFillColor: "#d0c7d3",
            WebkitUserSelect: "auto",
            userSelect: "auto"
        }
    }
}));

const StyledInput = styled(TextField)(() => ({
    "& .MuiInputLabel-root": {
        color: "white",

        "&.Mui-focused": {
            color: "#00fdfd"
        }
    },

    "& .MuiInput-input": {
        WebkitTextFillColor: "#d0c7d3",
        fontWeight: 500,

        "&.Mui-disabled": {
            WebkitTextFillColor: "#d0c7d3",
        },

        "&.Mui-error": {
            borderBottomColor: "red"
        }
    },

    "& .MuiInputBase-root": {
        caretColor: "white",

        "&:before": {
            borderBottom: "3px solid #049985"
        },

        "&:hover:not(.Mui-disabled, .Mui-error):before": {
            borderBottom: "3px solid #049985"
        },

        "& .Mui-error:before": {
            borderBottomColor: "red"
        },

        "&.Mui-disabled:before": {
            border: 0
        },

        "&:after": {
            borderBottom: "3px solid #00fdfd"
        },
    }
}));

type RecruitModalProps = {
    trigger: ReactElement
}
function RecruitModal({trigger}: RecruitModalProps): ReactElement {
    // Initialize the variables that contain the officer's info
    let name: string = "";
    let nif: string = "";
    let phone: string = "";
    let iban: string = "";
    let kms: number = 0;
    let discord: string = "";
    let steam: string = "";
    let recruit: boolean = false;

    const recruitMember = async (event: SubmitEvent) => {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await make_request(`/officerInfo/${nif}${recruit ? "?recruit": ""}`, "PUT",
            {
                name: name,
                nif: nif,
                phone: phone,
                iban: iban,
                kms: kms,
                discord: discord,
                steam: steam
            });

        // Check if the response is ok
        if (!recruitRequest.ok) {
            alert((await recruitRequest.json()).message);
            return;
        }

        // After recruiting the new member, we can reload the page using the officer's nif as a query param
        // @ts-ignore
        window.location = `${BASE_URL}/efetivos?nif=${nif}`;
    }

    return (
        <Modal width={"37%"} trigger={trigger} title={"Recrutar novo efetivo"}>
            {/*@ts-ignore*/}
            <form onSubmit={recruitMember}>
                <ModalSection title={"Informações Pessoais"}>
                    <div className={modalsStyle.formDiv}>
                        {/* TODO: add proper titles to explain the custom patterns */}
                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"Nome"}
                            type={"text"}
                            onChange={(event) => name = event.target.value}
                            error={name !== "" && !(/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/.test(name))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerName"
                            }}
                        />

                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"NIF"}
                            type={"text"}
                            onChange={(event) => nif = event.target.value}
                            error={nif !== "" && !(/^[0-9]{7,9}$/.test(nif))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerNIF"
                            }}
                        />

                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"Telemóvel"}
                            type={"text"}
                            onChange={(event) => phone = event.target.value}
                            error={phone !== "" && !(/^[0-9]{9}$/.test(phone))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerPhone"
                            }}
                        />

                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"IBAN"}
                            type={"text"}
                            onChange={(event) => iban = event.target.value}
                            error={iban !== "" && !(/^PT[0-9]{5,8}$/.test(iban))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerIBAN"
                            }}
                        />

                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"KMs"}
                            defaultValue={0}
                            type={"number"}
                            inputProps={{step: 100, name: "officerKMs"}}
                            onChange={(event) => kms = parseInt(event.target.value)}
                            sx={{margin: "10px 0 0 0"}}
                            required
                        />

                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"Discord ID"}
                            type={"text"}
                            onChange={(event) => discord = event.target.value}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerDiscord"
                            }}
                        />

                        <StyledInput
                            variant={"standard"}
                            fullWidth
                            label={"Steam ID / URL"}
                            type={"text"}
                            onChange={(event) => steam = event.target.value}
                            sx={{margin: "10px 0 0 0"}}
                            error={steam !== "" && !(/^steam:[0-9]{9}$/.test(steam)) && !(/^http(s)?:\/\/steamcommunity.com\/id\/.+/.test(steam))}
                            required
                            inputProps={{
                                name: "officerSteam"
                            }}
                        />

                        <FormControlLabel
                            control={<Switch
                                onChange={(event) => recruit = event.target.checked}
                            />}
                            label={"Recrutar como Cadete"}
                            sx={{
                                margin: "10px 0 0 0",

                            }}
                        />

                    </div>
                </ModalSection>

                <Button
                    type={"submit"}
                    variant={"outlined"}
                    fullWidth
                    sx={{
                        marginTop: "20px",
                        color: "green",
                        borderColor: "green",

                        "&:hover": {
                            borderColor: "darkgreen",
                            backgroundColor: "rgba(0, 100, 0, 0.4)",
                        }
                    }}
                >
                    Recrutar
                </Button>
            </form>
        </Modal>
    );
}

type FireModalProps = {
    trigger: ReactElement,
    officerFullName: string,
    officerNif: string,
}
function FireModal({trigger, officerFullName, officerNif}: FireModalProps) {
    // Initialize useNavigate hook
    const navigate = useNavigate();

    // Initialize the variable that contains the officer's fire reason
    let fireReason: string = "";

    const fireOfficer = async (event: SubmitEvent) => {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        const fireRequest = await make_request(
            `/officerInfo/${officerNif}`,
            "DELETE", {reason: fireReason}
        );

        // Check if the response is ok
        if (!fireRequest.ok) {
            alert((await fireRequest.json()).message);
            return;
        }

        // After firing the officer, we can reload the page to the officer's list
        navigate({
            pathname: "/efetivos"
        });
    }

    return (
        <Modal
            trigger={trigger}
            title={`Despedir ${officerFullName}`}
        >
            {/*@ts-ignore*/}
            <form onSubmit={fireOfficer}>
                <div className={modalsStyle.formDiv}>
                    {/*Text area to input the firing reason*/}
                    <ModalSection title={"Dados do Despedimento"}>
                        <TextField
                            label={"Motivo"}
                            fullWidth
                            multiline
                            maxRows={5}
                            className={modalsStyle.fireTextArea}
                            onChange={(event) => fireReason = event.target.value}
                            sx={{
                                "& label.Mui-focused": {
                                  color: "white"
                                },

                                "& .MuiOutlinedInput-root": {
                                    "&.Mui-focused fieldset": {
                                        borderColor: "#00fdfd"
                                    }
                                }
                            }}
                        />
                    </ModalSection>

                    {/*Button to submit the form and, therefore, fire the officer*/}
                    <button className={modalsStyle.fireButton} type={"submit"}>Despedir</button>
                </div>
            </form>
        </Modal>
    );
}

type InformationPairProps = {
    label: string,
    value: string | number,
    type?: string,
    pattern?: RegExp,
    editMode: boolean,
    onChangeCallback?: ((event: ChangeEvent<HTMLInputElement>) => void) | any,
    step?: number,
    isSelect?: boolean,
    children?: ReactElement | [ReactElement]
}
const InformationPair = ({label, value, type = "text", pattern, editMode, onChangeCallback, step, isSelect = false, children}: InformationPairProps): ReactElement => {

    // If it's not a select, return a basic input
    if (!isSelect) {
        return (
            <div className={style.informationPairDiv}>
                <label>{label}</label>
                <StyledInput
                    variant={"standard"}
                    fullWidth
                    disabled={!editMode}
                    type={type}
                    error={(pattern !== undefined) && !(pattern.test(String(value)))}
                    value={value}
                    onChange={onChangeCallback}
                    inputProps={{
                        step: step,
                        pattern: pattern !== undefined ? pattern.source: undefined
                    }}
                />
            </div>
        );
    }

    // If it's a select, return a select input
    return (
        <div className={style.informationPairDiv}>
            <label>{label}</label>
            <StyledSelect
                variant={"standard"}
                fullWidth
                disabled={!editMode}
                value={value}
                onChange={onChangeCallback}
                slotProps={OfficerInfoSelectSlotProps}
            >
                {children}
            </StyledSelect>
        </div>
    );

}

type roleFormat = {
    id: number,
    name: string
}
type unitFormat = {
    id: number,
    name: string,
    role: number
}
type SpecialUnitsTableRowProps = {
    selectSx: any,
    unit: unitFormat,
    unitName: string,
    unitRoles: any,
    editMode: boolean,
    onChange: ((event: SelectChangeEvent, unitId: number) => void),
    onRemove: (() => void)
}
const SpecialUnitsTableRow = ({selectSx, unit, unitName, unitRoles, editMode, onChange, onRemove}: SpecialUnitsTableRowProps) => {
    return (
        <TableRow
            key={`unitstableunit#${unit.id}`}
            sx={!editMode ? {'&:last-child td, &:last-child th': { border: 0 }}: {'&:last-child td, &:last-child th': { borderColor: "#049985", borderBottomStyle: "dashed" }}}
        >
            <TableCell sx={{color: "#d0c7d3"}}>{unitName}</TableCell>
            <TableCell>
                <Select
                    value={String(unit.role)}
                    disabled={!editMode}
                    onChange={(event: SelectChangeEvent) => onChange(event, unit.id)}
                    fullWidth
                    sx={selectSx}
                >
                    {unitRoles.map((role: unitFormat) => {
                        return (
                            <MenuItem key={`role${role.id}`} value={role.id}>{role.name}</MenuItem>
                        )
                    })}
                </Select>
            </TableCell>
            {!editMode ? "":
                <TableCell>
                    {/*TODO: Add the handler for the onRemove event*/}
                    <button>Remover</button>
                </TableCell>
            }
        </TableRow>
    )
}

type SpecialUnitsTableProps = {
    editMode: boolean,
    officerSpecialUnits: any,
    onChange: ((event: SelectChangeEvent, unitId: number) => void),
    onRemove: (() => void),
    onAdd: (() => void)
}
const SpecialUnitsTable = ({editMode, officerSpecialUnits, onChange, onRemove, onAdd}: SpecialUnitsTableProps) => {
    const SelectSx= {
        "& .MuiSelect-select.MuiInputBase-input.MuiOutlinedInput-input": {
            paddingRight: "32px !important",

            "&, &.Mui-disabled": {
                WebkitTextFillColor: "#d0c7d3",
            },

            "&.Mui-disabled": {
                paddingRight: "14px !important"
            },

            "&.MuiSelect-select": {
                textAlign: "center"
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

    const [specialUnits, setSpecialUnits] = useState([]);
    const [specialUnitsRoles, setSpecialUnitsRoles] = useState([]);

    useEffect(() => {
        async function getSpecialUnits() {
            const specialUnitsResponse = await make_request("/util/specialunits", "GET");

            // Mandatory check if the status code was 200
            // TODO: Do something actually useful with the error
            if (!specialUnitsResponse.ok)
                return;

            const specialUnitsResponseJson = await specialUnitsResponse.json();

            // Apply the units and their roles to the objects of the class
            setSpecialUnits(specialUnitsResponseJson.data["units"]);
            setSpecialUnitsRoles(specialUnitsResponseJson.data["roles"]);
        }

        getSpecialUnits();
    }, []);

    // Defining util functions
    function getUnitNameFromId(unitId: number): string {
        let unit: unitFormat
        for (unit of specialUnits) {
            if (unit.id === unitId) {
                return unit.name;
            }
        }

        return "Unidade não encontrada";
    }

    return (
        <TableContainer>
            <Table size={"small"} padding={"normal"}>
                <TableHead>
                    <TableRow>
                        <TableCell align={"center"} sx={{color: "#d0c7d3"}}>Unidade</TableCell>
                        <TableCell align={"center"} sx={{color: "#d0c7d3"}}>Cargo</TableCell>
                        {!editMode ? "":
                            <TableCell align={"center"} sx={{color: "#d0c7d3"}}>Ação</TableCell>
                        }
                    </TableRow>
                </TableHead>
                <TableBody>
                    {/*Cycle through all units of the officer and display it's roles*/}
                    {officerSpecialUnits.map((unit: unitFormat) => {
                        return (
                            <SpecialUnitsTableRow
                                selectSx={SelectSx}
                                unit={unit}
                                unitName={getUnitNameFromId(unit.id)}
                                unitRoles={specialUnitsRoles}
                                editMode={editMode}
                                onChange={onChange}
                                onRemove={() => {}}
                            />
                        );
                    })}
                </TableBody>
                {!editMode ? "":
                    <TableFooter>
                        <TableRow>
                            {/*Select to change Unit*/}
                            <TableCell>
                                <Select
                                    fullWidth
                                    sx={SelectSx}
                                >
                                    {/*TODO: This must use a function that only return the units the officer doesn't belong to*/}
                                    {specialUnits.map((unit: unitFormat) => {
                                        return (
                                            <MenuItem key={`newUnit${unit.id}`} value={unit.id}>{unit.name}</MenuItem>
                                        )
                                    })}
                                </Select>
                            </TableCell>

                            {/*Select to change role*/}
                            <TableCell>
                                <Select
                                    fullWidth
                                    sx={SelectSx}
                                >
                                    {specialUnitsRoles.map((role: roleFormat) => {
                                        return (
                                            <MenuItem key={`newUniRole${role.id}`} value={role.id}>{role.name}</MenuItem>
                                        )
                                    })}
                                </Select>

                            </TableCell>

                            {/*Select to commit addition*/}
                            <TableCell>
                                <button>Adicionar</button>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                }
            </Table>
        </TableContainer>
    )
}

function OfficerInfo() {
    // Type declaration for the OfficerInfo state
    type OfficerInfoState = {
        personal: {
            name: string,
            phone: string,
            iban: string,
            kms: number,
            discord: string,
            steam: string
        },
        professional: {
            patent: number,
            callsign: string,
            status: number,
            entry_date: string,
            promotion_date: string,
            special_units: []
        }
    }

    // Variable that will hold the logged user information from context
    const loggedUser = useContext(LoggedUserContext);

    const navigate = useNavigate();

    // State that controls the loading state of the page
    const [loading, setLoading] = useState<boolean>(true);

    // State that controls the edit mode of the page
    const [editMode, setEditMode] = useState<boolean>(false);

    // State variables that hold the possible options for the patents, statuses, special units and units roles
    const [patents, setPatents] = useState<[{id: number, name: string}] | any>([]);
    const [statuses, setStatuses] = useState<[{id: number, name: string}] | any>([]);
    const [specialUnits, setSpecialUnits] = useState<[{id: number, name: string}] | any>([]);
    const [unitsRoles, setUnitsRoles] = useState<{id: number, name: string} | any>([]);

    // State variable that holds the officer's info
    const [officerNif, setOfficerNif] = useState("");
    const [officerInfo, setOfficerInfo] = useState<OfficerInfoState>({
        personal: {
            discord: "",
            iban: "",
            kms: 0,
            name: "",
            phone: "",
            steam: ""
        },
        professional: {
            callsign: "",
            entry_date: "",
            patent: 0,
            promotion_date: "",
            special_units: [],
            status: 0
        }
    })

    // Variable that dictates whether the logged user can edit the current officer.
    let canEdit: boolean = loggedUser.intents.officer && loggedUser.info.professional.patent > officerInfo.professional.patent;

    async function fetchOfficerInfo() {
        // Don't try to fetch the officer's info if the nif is empty
        if (officerNif === "") return;

        // First, we need to set the loading state to true if not already
        if (!loading)
            setLoading(true);

        const response = await make_request(`/officerInfo/${officerNif}?raw`, "GET");

        // Check if the response is ok. If not, don't do anything and keep the page loading.
        // This should probably only happen onb first load.
        if (!response.ok) {
            return;
        }

        // Convert the received data to JSON and fetch the actual data
        const data = (await response.json()).data;

        // Apply the data to the officerInfo object
        setOfficerInfo(prevOfficerInfo => ({
               personal: {
                   name: data.name,
                   phone: data.phone,
                   iban: data.iban,
                   kms: data.kms,
                   discord: data.discord,
                   steam: data.steam
               },
               professional: {
                   patent: data.patent,
                   callsign: data.callsign,
                   entry_date: data.entry_date,
                   promotion_date: data.promotion_date,
                   status: data.status,
                   special_units: data.special_units
               },
        }));

        // After fetching the data, we can set the loading state to false
        setLoading(false);
    }

    async function updateOfficerInfo(event: SubmitEvent) {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        // We need to set the loading state to true if not already and use the same call to set the hadEditPermissions to false and thus hide the edit and fire buttons until permissions are calculated again
        if (!loading) {
            setLoading(true);
        }

        // Make the request to update the officer's info
        const updateRequest = await make_request(`/officerInfo/${officerNif}`, "PATCH",
            {
            // Personal Info
            name: officerInfo.personal.name,
            phone: officerInfo.personal.phone,
            iban: officerInfo.personal.iban,
            kms: officerInfo.personal.kms,
            discord: officerInfo.personal.discord,
            steam: officerInfo.personal.steam,

            // Professional Info
            patent: officerInfo.professional.patent,
            callsign: officerInfo.professional.callsign,
            status: officerInfo.professional.status,
            entry_date: officerInfo.professional.entry_date,
            promotion_date: officerInfo.professional.promotion_date,

            // Special Units
            special_units: officerInfo.professional.special_units
        });

        // Check if the response is ok
        if (!updateRequest.ok) {
            alert((await updateRequest.json()).message);
            return;
        }

        // After updating the data, we can reload the page using the officer's nif as a query param
        navigate({
            pathname: "/efetivos",
            search: createSearchParams({
                nif: officerNif
            }).toString()
        });
    }

    // Effect to run when the page first loads
    useEffect(() => {
        async function firstMount() {
            // When the page loads, we need to fetch the available patents and statuses
            const patentsResponse = await make_request("/util/patents", "GET");

            // Mandatory check if the status code was 200
            // TODO: Do something actually useful with the error
            if (!patentsResponse.ok) {
                return;
            }

            // Apply the data to the state
            setPatents((await patentsResponse.json()).data);

            const statusResponse = await make_request("/util/statuses", "GET");

            // Mandatory check if the status code was 200
            // TODO: Do something actually useful with the error
            if (!statusResponse.ok) {
                return;
            }

            // Apply the data to the class object
            setStatuses((await statusResponse.json()).data);

            // Checking if there's a nif in the query params to instantly load the officer's info
            const queryParams = new URLSearchParams(window.location.search);
            const queryNif = queryParams.get("nif");

            setOfficerNif(queryNif || loggedUser.info.personal.nif);
        }

        firstMount();
    }, []);

    // Whenever the nif in state changes, we need to fetch the officer's info
    useEffect(() => {
        fetchOfficerInfo();
    }, [officerNif]);

    function doesUserBelongToUnit(unit_id: number) {
        let unit: unitFormat
        for (unit of officerInfo.professional.special_units) {
            if (unit.id === unit_id) {
                return true;
            }
        }
        return false;
    }

    function officerListCallback(nif: string) {
        // Make sure we don't change officer's while editing
        setEditMode(false);

        // Change the nif in state so useEffect can handle the info fetching
        setOfficerNif(nif);
    }

    function handleInformationChange(category: "personal" | "professional", info: string, value: any) {
        setOfficerInfo(prevOfficerInfo => ({
            ...prevOfficerInfo,
            [category]: {
                ...prevOfficerInfo[category],
                [info]: value
            }
        }));
    }

    function handleSpecialUnitsEdit(event: any, unitId: number) {
        // Create a copy of the units the officer belongs to
        const specialUnits = officerInfo.professional.special_units;

        // Get the unit from the officer's special units
        const unit: unitFormat | undefined = specialUnits.find((unit: unitFormat) => unit.id === unitId);

        // Update the unit's role
        unit!.role = event.target.value;

        // Push the unit back to the officer's special units, while replacing the old one
        // @ts-ignore
        specialUnits[specialUnits.findIndex(unit)] = unit;

        // Update the officer's special units
        setOfficerInfo({
            ...officerInfo,
            professional: {
                ...officerInfo.professional,
                special_units: specialUnits
            }
        });
    }

    // Before rendering the page, we need to build the patentes and status options
    const patentesOptions = patents.map((patent: {id: number, name: string}) => {
        return <MenuItem key={`patent${patent.id}`} value={patent.id} disabled={patent.id > loggedUser.info.professional.patent}>{patent.name}</MenuItem>
    });

    const statusOptions = statuses.map((status: {id: number, name: string}) => {
       return <MenuItem key={`status${status.id}`} value={status.id}>{status.name}</MenuItem>
    });

    const specialUnitsOptions = specialUnits.map((unit: unitFormat) => {
       if (!doesUserBelongToUnit(unit.id))
           return <option key={`unit${unit.id}`} value={unit.id}>{unit.name}</option>
    });

    let officerFullName = "";
    if (patents.length > 0) {
        officerFullName = `${patents[officerInfo.professional.patent + 1].name} ${officerInfo.personal.name}`;
    }

    return (
        <div>
            {/*Div that splits the screen*/}
            <ScreenSplit
                leftSidePercentage={30}
                leftSideComponent={<OfficerList callbackFunction={officerListCallback}/>}
            >
                {/*Div where content's will be*/}
                <div className={style.officerInfoInnerDiv}>
                    {/*Div that holds the buttons to alter the officer's info*/}
                    <div className={style.officerInfoAlterbarDiv}>
                        <button type={"submit"} form={"information-form"}
                                className={[style.officerInfoAlterButton, style.officerInfoAlterButtonSave].join(" ")}
                                hidden={!editMode}>Guardar
                        </button>

                        <RecruitModal trigger={<button
                            className={[style.officerInfoAlterButton, style.officerInfoAlterButtonCreate].join(" ")}
                            hidden={editMode || !loggedUser.intents.officer}>Recrutar</button>}></RecruitModal>

                        <button
                            className={[style.officerInfoAlterButton, style.officerInfoAlterButtonEdit].join(" ")}
                            hidden={editMode || !canEdit}
                            onClick={() => setEditMode(true)}>Editar
                        </button>

                        <FireModal trigger={<button
                            className={[style.officerInfoAlterButton, style.officerInfoAlterButtonDelete].join(" ")}
                            hidden={editMode || !canEdit}>Despedir</button>} officerFullName={officerFullName} officerNif={officerNif}></FireModal>

                        {/* TODO: This button should only appear when the logged user has the "accounts" intent. Class and functionality needs to be done */}
                        <button
                            className={[style.officerInfoAlterButton, style.officerInfoAlterButtonImport].join(" ")}
                            style={{float: "left"}} hidden={editMode || !loggedUser.intents.officer}>Gerir Conta
                        </button>
                        <button
                            className={[style.officerInfoAlterButton, style.officerInfoAlterButtonImport].join(" ")}
                            style={{float: "left"}} hidden={editMode || !loggedUser.intents.officer}
                        >
                            Importar do HUB
                        </button>
                    </div>

                    {/*@ts-ignore*/}
                    <form id={"information-form"} onSubmit={updateOfficerInfo}>
                        {/*Loader Div*/}
                        <div className={style.officerInfoDetailsDiv} style={{
                            justifyContent: "center",
                            alignItems: "center", display: `${loading ? "flex": "none"}`}}>
                            <Loader/>
                        </div>

                        {/*Information div*/}
                        <div className={style.officerInfoDetailsDiv} style={loading ? {display: "none"}: {}}>
                            <fieldset>
                                <legend>Informação Pessoal</legend>

                                <div className={style.officerInfoInnerFieldsetDiv}>
                                    {/*Name pair*/}
                                    {/*Pattern Unit tests: https://regex101.com/r/pdl46q/1*/}
                                    <InformationPair
                                        label={"Nome:"}
                                        value={officerInfo.personal.name}
                                        pattern={/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("personal", "name", event.target.value)}
                                    />
                                    <Divider flexItem/>

                                    {/*NIF pair*/}
                                    <InformationPair
                                        label={"NIF:"}
                                        value={officerNif}
                                        editMode={false}
                                    />
                                    <Divider flexItem/>

                                    {/*Cellphone pair*/}
                                    <InformationPair
                                        label={"Telemóvel:"}
                                        value={officerInfo.personal.phone}
                                        pattern={/^[0-9]{9}$/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("personal", "phone", event.target.value)}
                                    />
                                    <Divider flexItem/>

                                    {/*IBAN pair*/}
                                    <InformationPair
                                        label={"IBAN:"}
                                        value={officerInfo.personal.iban}
                                        pattern={/^PT[0-9]{5,8}$/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("personal", "iban", event.target.value)}
                                    />
                                    <Divider flexItem/>

                                    {/*KMs pair*/}
                                    <InformationPair
                                        label={"KMs:"}
                                        value={officerInfo.personal.kms}
                                        editMode={editMode}
                                        type={"number"}
                                        step={100}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("personal", "kms", event.target.value)}
                                    />
                                    <Divider flexItem/>

                                    {/*Discord pair*/}
                                    <InformationPair
                                        label={"Discord:"}
                                        value={officerInfo.personal.discord}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("personal", "discord", event.target.value)}
                                    />
                                    <Divider flexItem/>

                                    {/*Steam pair*/}
                                    {/*Pattern Unit tests: https://regex101.com/r/cZ5DjR/2*/}
                                    <InformationPair
                                        label={"Steam:"}
                                        value={officerInfo.personal.steam}
                                        pattern={/(^steam:([0-9]|[a-z])+$)|(^http(s)?:\/\/steamcommunity\.com\/id\/.+$)/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("personal", "steam", event.target.value)}
                                    />
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>Informação Profissional</legend>

                                <div className={style.officerInfoInnerFieldsetDiv}>
                                    {/*Patente pair*/}
                                    <InformationPair
                                        label={"Patente:"}
                                        value={officerInfo.professional.patent}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("professional", "patent", event.target.value)}
                                        isSelect
                                    >
                                        {patentesOptions}
                                    </InformationPair>
                                    <Divider/>

                                    {/*CallSign pair*/}
                                    <InformationPair
                                        label={"CallSign:"}
                                        value={officerInfo.professional.callsign}
                                        pattern={/^[FSTODCZAG]-([0-9]){2}$/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("professional", "callsign", event.target.value)}
                                    />
                                    <Divider/>

                                    {/*Status pair*/}
                                    <InformationPair
                                        label={"Status:"}
                                        value={officerInfo.professional.status}
                                        isSelect
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("professional", "status", event.target.value)}
                                    >
                                        {statusOptions}
                                    </InformationPair>
                                    <Divider/>

                                    {/*Data de Entrada pair*/}
                                    <InformationPair
                                        label={"Data de Entrada:"}
                                        value={officerInfo.professional.entry_date}
                                        type={"date"}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => handleInformationChange("professional", "entry_date", event.target.value)}
                                    />
                                    <Divider/>

                                    {/*Data de Subida pair*/}
                                    <InformationPair
                                        label={"Data de Subida:"}
                                        value={officerInfo.professional.promotion_date}
                                        type={"date"}
                                        editMode={false}
                                    />
                                    <Divider/>

                                    {/*Unidades Especiais*/}
                                    <div className={style.informationPairDiv}>
                                        <label>Unidades Especiais:</label>
                                        <SpecialUnitsTable
                                            editMode={editMode}
                                            officerSpecialUnits={officerInfo.professional.special_units}
                                            onChange={handleSpecialUnitsEdit}
                                            onRemove={() => {}}
                                            onAdd={() => {}}
                                        />
                                    </div>
                                </div>
                            </fieldset>

                            <fieldset>
                                <legend>Atividade</legend>

                                <p>Justificação ativa: <span></span>
                                </p>
                                <p>Última picagem: <span></span>
                                </p>
                                <p>Última
                                    semana: <span>{"N/A"}</span>
                                </p>
                            </fieldset>
                            <fieldset>
                                <legend>Punições</legend>

                                <p>Punição Ativa: <span></span>
                                </p>
                                <p>Histórico: <span></span>
                                </p>
                            </fieldset>
                        </div>
                    </form>
                </div>
            </ScreenSplit>
        </div>
    )
}

export default OfficerInfo;