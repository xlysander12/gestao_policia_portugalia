import React, {ChangeEvent, ReactElement, useContext, useEffect, useState} from "react";
import style from "./officerinfo.module.css";
import modalsStyle from "./officerinfomodals.module.css";
import OfficerList from "../../components/OfficerList/officer-list";
import Loader from "../../components/Loader/loader";
import {Modal, ModalSection} from "../../components/Modal/modal";
import {make_request} from "../../utils/requests";
import {
    Divider,
    FormControlLabel,
    MenuItem,
    Select, SelectChangeEvent, Stack,
    Switch, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow,
    Typography
} from "@mui/material";
import {CheckCircleOutlined, CancelOutlined} from "@mui/icons-material";
import ScreenSplit from "../../components/ScreenSplit/screen-split";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import {useNavigate, useParams} from "react-router-dom";
import {ForceDataContext, ForceDataContextType, getPatentFromId, SpecialUnit} from "../../force-data-context.ts";
import {toast} from "react-toastify";
import {useImmer} from "use-immer";
import {AccountInfoResponse} from "@portalseguranca/api-types/api/account/schema";
import {
    DefaultButton,
    DefaultOutlinedTextField, DefaultSelect,
    DefaultTextField
} from "../../components/DefaultComponents";

type RecruitModalProps = {
    open: boolean
    onClose?: () => void
}
function RecruitModal({open, onClose}: RecruitModalProps): ReactElement {
    // Initialize the state that contain the new officer's info
    const [officerInfo, setOfficerInfo] = useImmer({
        name: "",
        nif: "",
        phone: "",
        iban: "",
        kms: 0,
        discord: "",
        steam: "",
        recruit: false
    });

    // Navigate hook
    const navigate = useNavigate();

    const recruitMember = async (event: SubmitEvent) => {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await make_request(`/officers/${officerInfo.nif}${officerInfo.recruit ? "?recruit": ""}`, "PUT",
            {
                body: {
                    name: officerInfo.name,
                    nif: officerInfo.nif,
                    phone: officerInfo.phone,
                    iban: officerInfo.iban,
                    kms: officerInfo.kms,
                    discord: officerInfo.discord,
                    steam: officerInfo.steam
                }
            });

        // Check if the response is ok
        if (!recruitRequest.ok) {
            alert((await recruitRequest.json()).message);
            return;
        }

        // After recruiting the new member, we can reload the page using the officer's nif as a query param
        toast(`Agente ${officerInfo.name} contratado com sucesso!`, {type: "success"});
        navigate(`/efetivos/${officerInfo.nif}`);
    }

    return (
        <Modal width={"37%"} open={open} onClose={onClose} title={"Recrutar novo efetivo"}>
            {/*@ts-ignore*/}
            <form onSubmit={recruitMember}>
                <ModalSection title={"Informações Pessoais"}>
                    <div className={modalsStyle.formDiv}>
                        {/* TODO: add proper titles to explain the custom patterns */}
                        <DefaultTextField
                            fullWidth
                            label={"Nome"}
                            type={"text"}
                            onChange={(event) => setOfficerInfo(draft => {draft.name = event.target.value})}
                            error={officerInfo.name !== "" && !(/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/.test(officerInfo.name))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerName",
                                pattern: "^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$"
                            }}
                        />

                        <DefaultTextField
                            fullWidth
                            label={"NIF"}
                            type={"text"}
                            onChange={(event) => setOfficerInfo(draft => {draft.nif = event.target.value})}
                            error={officerInfo.nif !== "" && !(/^[0-9]{7,9}$/.test(officerInfo.nif))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerNIF",
                                pattern: "^[0-9]{7,9}$"
                            }}
                        />

                        <DefaultTextField
                            fullWidth
                            label={"Telemóvel"}
                            type={"text"}
                            onChange={(event) => setOfficerInfo(draft => {draft.phone = event.target.value})}
                            error={officerInfo.phone !== "" && !(/^[0-9]{9}$/.test(officerInfo.phone))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerPhone",
                                pattern: "^[0-9]{9}$"
                            }}
                        />

                        <DefaultTextField
                            fullWidth
                            label={"IBAN"}
                            type={"text"}
                            onChange={(event) => setOfficerInfo(draft => {draft.iban = event.target.value})}
                            error={officerInfo.iban !== "" && !(/^PT[0-9]{5,8}$/.test(officerInfo.iban))}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerIBAN",
                                pattern: "^PT[0-9]{5,8}$"
                            }}
                        />

                        <DefaultTextField
                            fullWidth
                            label={"KMs"}
                            defaultValue={0}
                            type={"number"}
                            inputProps={{step: 100, name: "officerKMs"}}
                            onChange={(event) => setOfficerInfo(draft => {draft.kms = Number(event.target.value)})}
                            sx={{margin: "10px 0 0 0"}}
                            required
                        />

                        <DefaultTextField
                            fullWidth
                            label={"Discord ID"}
                            type={"text"}
                            onChange={(event) => setOfficerInfo(draft => {draft.discord = event.target.value})}
                            sx={{margin: "10px 0 0 0"}}
                            required
                            inputProps={{
                                name: "officerDiscord"
                            }}
                        />

                        <DefaultTextField
                            fullWidth
                            label={"Steam ID / URL"}
                            type={"text"}
                            onChange={(event) => setOfficerInfo(draft => {draft.steam = event.target.value})}
                            sx={{margin: "10px 0 0 0"}}
                            error={officerInfo.steam !== "" && !(/^steam:[0-9]{9}$/.test(officerInfo.steam)) && !(/^http(s)?:\/\/steamcommunity.com\/id\/.+/.test(officerInfo.steam))}
                            required
                            inputProps={{
                                name: "officerSteam",
                                pattern: "(^steam:([0-9]|[a-z])+$)|(^http(s)?:\/\/steamcommunity\.com\/id\/.+$)"
                            }}
                        />

                        <FormControlLabel
                            control={<Switch
                                onChange={(event) => setOfficerInfo(draft => {draft.recruit = event.target.checked})}
                            />}
                            label={"Recrutar como Cadete"}
                            sx={{
                                margin: "10px 0 0 0",

                            }}
                        />

                    </div>
                </ModalSection>

                <DefaultButton
                    type={"submit"}
                    buttonColor={"green"}
                    fullWidth
                >
                    Contratar
                </DefaultButton>
            </form>
        </Modal>
    );
}

type FireModalProps = {
    open: boolean,
    onClose: () => void,
    officerFullName: string,
    officerNif: string,
}
function FireModal({open, onClose, officerFullName, officerNif}: FireModalProps) {
    // Initialize useNavigate hook
    const navigate = useNavigate();

    // Initialize the variable that contains the officer's fire reason
    let fireReason: string = "";

    const fireOfficer = async (event: SubmitEvent) => {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        const fireRequest = await make_request(
            `/officers/${officerNif}`,
            "DELETE", {body: {reason: fireReason}}
        );

        // Check if the response is ok
        if (!fireRequest.ok) {
            alert((await fireRequest.json()).message);
            return;
        }

        // After firing the officer, we can show a notification and reload the page to the officer's list
        toast(`${officerFullName} despedido com sucesso!`, {type: "success"});
        navigate({
            pathname: "/efetivos"
        });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Despedir ${officerFullName}`}
        >
            {/*@ts-ignore*/}
            <form onSubmit={fireOfficer}>
                <div className={modalsStyle.formDiv}>
                    {/*Text area to input the firing reason*/}
                    <ModalSection title={"Dados do Despedimento"}>
                        <DefaultOutlinedTextField
                            label={"Motivo"}
                            fullWidth
                            multiline
                            maxRows={5}
                            onChange={(event) => fireReason = event.target.value}
                        />
                    </ModalSection>

                    {/*Button to submit the form and, therefore, fire the officer*/}
                    <DefaultButton buttonColor={"red"} type={"submit"}>Despedir</DefaultButton>
                </div>
            </form>
        </Modal>
    );
}

type AccountInformationModalProps = {
    open: boolean,
    onClose: () => void,
    officerNif: string,
    officerFullName: string
}
function AccountInformationModal({open, onClose, officerNif, officerFullName}: AccountInformationModalProps) {
    // Getting the force's data from the context
    const forceData = useContext<ForceDataContextType>(ForceDataContext);

    const [accountExists, setAccountExists] = useState<boolean | null>(null);

    // Initialize the state that contains the officer's account information
    // // Create an object with all intents and set them to false
    let intentsObject: {[key: string]: boolean} = {};
    for (let intent of forceData.intents) {
        intentsObject[intent.name] = false;
    }

    const [accountInfo, setAccountInfo] = useImmer({
        defaultPassword: false,
        lastUsed: new Date(),
        intents: intentsObject
    });

    // Fetch the current information about the officer
    useEffect(() => {
        async function fetchAccountInfo() {
            const accountInfoResponse = await make_request(`/accounts/${officerNif}/info`, "GET");

            // Check if the response is ok
            if (accountInfoResponse.status === 404) {
                setAccountExists(false);
                return;
            }

            // Convert the response to JSON and set the account info state
            const accountInfoJson: AccountInfoResponse = await accountInfoResponse.json();
            setAccountInfo(draft => {
                draft.defaultPassword = accountInfoJson.data.passwordChanged;
                draft.lastUsed = accountInfoJson.data.lastUsed;
                draft.intents = accountInfoJson.data.intents;
            });

            setAccountExists(true);
        }

        fetchAccountInfo();
    }, [officerNif]);

    let modalContent: ReactElement;

    if (accountExists === null) {
        modalContent = (
            <Loader size={"100px"}/>
        );
    } else if (!accountExists) {
        modalContent = (
            <div className={modalsStyle.noAccountDiv}>
                <Typography color={"var(--portalseguranca-color-text-light)"}>Este efetivo não tem a conta ativada.<br/>Ativar a conta vai permitir o login com este nif e a palavra-passe padrão</Typography>
                {/*TODO: Change onClick behaviour*/}
                <DefaultButton
                    buttonColor={"var(--portalseguranca-color-accent)"}
                    darkTextOnHover
                    onClick={async () => {console.log("Activate account")}}
                    sx={{
                        marginTop: "10px"
                    }}
                >
                    Ativar Conta
                </DefaultButton>
            </div>
        );
    } else {
        modalContent = (
            <>
                <ModalSection title={"Informações Gerais"}>
                    <div className={modalsStyle.informationInnerSectionDiv}>
                        <Stack alignItems={"center"} direction={"row"} gap={0.5}>
                            <Typography>Palavra-passe alterada:</Typography>
                            {accountInfo.defaultPassword ? <CheckCircleOutlined sx={{color: "green"}}/> : <CancelOutlined sx={{color: "red"}}/>}
                        </Stack>
                        {/* <label>Última utilização: <span>{accountInfo.lastUsed.toLocaleDateString()}</span></label> */}
                    </div>
                </ModalSection>

                <ModalSection title={"Permissões"}>
                    <div className={modalsStyle.informationInnerSectionDiv}>
                        {forceData.intents.map((intent) => {
                            return (
                                <FormControlLabel
                                    control={<Switch
                                        checked={accountInfo.intents[intent.name]}
                                        onChange={(event) => setAccountInfo(draft => {draft.intents[intent.name] = event.target.checked})}
                                    />}
                                    label={intent.description}
                                />
                            )
                        })}
                    </div>
                </ModalSection>
            </>
        )
    }

    return (
        <Modal open={open} onClose={onClose} title={`Conta de ${officerFullName}`}>
            {modalContent}
        </Modal>
    )
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
                <DefaultTextField
                    fullWidth
                    sameTextColorWhenDisabled
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
            <DefaultSelect
                fullWidth
                sameTextColorWhenDisabled
                disabled={!editMode}
                value={value}
                onChange={onChangeCallback}
            >
                {children}
            </DefaultSelect>
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

    // Handy hooks
    const navigate = useNavigate();
    let {nif} = useParams();

    // State that controls the loading state of the page
    const [loading, setLoading] = useState<boolean>(true);

    // State that controls the edit mode of the page
    const [editMode, setEditMode] = useState<boolean>(false);

    // Get all of the force's constant data
    const forceData = useContext<ForceDataContextType>(ForceDataContext);

    // State variable that holds the officer's info
    const [officerNif, setOfficerNif] = useState(nif || loggedUser.info.personal.nif);
    const [officerInfo, setOfficerInfo] = useImmer<OfficerInfoState>({
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

    // State variables for the different modals
    const [isAccountModalOpen, setAccountModalOpen] = useState<boolean>(false);
    const [isRecruitModalOpen, setRecruitModalOpen] = useState<boolean>(false);
    const [isFireModalOpen, setFireModalOpen] = useState<boolean>(false);

    // Variable that dictates whether the logged user can edit the current officer.
    let canEdit: boolean = loggedUser.intents.officers && loggedUser.info.professional.patent > officerInfo.professional.patent;

    async function fetchOfficerInfo() {
        // Don't try to fetch the officer's info if the nif is empty
        if (officerNif === "") return;

        // First, we need to set the loading state to true if not already
        if (!loading)
            setLoading(true);

        const response = await make_request(`/officers/${officerNif}`, "GET");

        // Check if the response is 404. If it is, most likely the user has inputted an non existing nif in param
        if (response.status === 404) {
            toast("O NIF inserido não corresponde a nenhum efetivo.", {type: "error"});
            return setOfficerNif(loggedUser.info.personal.nif); // Set the active nif as the logged user
        }

        // Convert the received data to JSON and fetch the actual data
        const data = (await response.json()).data;

        // Apply the data to the officerInfo object
        setOfficerInfo({
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
               }
        });

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
        const updateRequest = await make_request(`/officers/${officerNif}`, "PATCH",
            {
                body: {
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
                }
        });

        // Check if the response is ok
        if (!updateRequest.ok) {
            alert((await updateRequest.json()).message);
            return;
        }

        // After updating the data, we can show a notification and reload the page using the officer's nif as a param
        toast("Informações atualizadas com sucesso!", {type: "success"});
        navigate({
            pathname: `/efetivos/${officerNif}`,
        });
    }

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
        setOfficerInfo(draft => {
            // @ts-ignore
            draft[category][info] = value
        });
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
        setOfficerInfo(draft => {
            draft.professional.special_units = specialUnits;
        })
    }

    // Before rendering the page, we need to build the patentes and status options
    const patentesOptions = forceData.patents.map((patent) => {
        return <MenuItem key={`patent${patent.id}`} value={patent.id} disabled={patent.id > loggedUser.info.professional.patent}>{patent.name}</MenuItem>
    });

    const statusOptions = forceData.statuses.map((status: {id: number, name: string}) => {
       return <MenuItem key={`status${status.id}`} value={status.id}>{status.name}</MenuItem>
    });

    const specialUnitsOptions = forceData.special_units.map((unit: SpecialUnit) => {
       if (!doesUserBelongToUnit(unit.id))
           return <option key={`unit${unit.id}`} value={unit.id}>{unit.name}</option>
    });

    return (
        <>
            {/*Div that splits the screen*/}
            <ScreenSplit
                leftSidePercentage={30}
                leftSideComponent={<OfficerList callbackFunction={officerListCallback}/>}
            >
                {/*Div where content's will be*/}
                <div className={style.officerInfoInnerDiv}>
                    {/*Div that holds the buttons to alter the officer's info*/}
                    <div className={style.officerInfoAlterbarDiv}>
                        {/*Buttons that lie on the left side of the bar*/}
                        <div className={style.officerInfoAlterbarLeft}>
                            {/*//TODO: Hidden attribute doesn't work*/}
                            <DefaultButton
                                hidden={editMode || !loggedUser.intents.accounts || loggedUser.info.professional.patent < officerInfo.professional.patent}
                                onClick={() => setAccountModalOpen(true)}
                            >
                                Gerir Conta
                            </DefaultButton>

                            <DefaultButton
                                hidden={editMode || !loggedUser.intents.officers}
                            >
                                Importar do HUB
                            </DefaultButton>
                        </div>

                        {/*Buttons that lie on the right side of the bar*/}
                        <div className={style.officerInfoAlterbarRight}>
                            {editMode && <DefaultButton
                                type={"submit"}
                                form={"information-form"}
                                sx={{flex: 1}}
                            >
                                Guardar
                            </DefaultButton>}

                            {(!editMode && loggedUser.intents.officers) &&
                                <DefaultButton
                                    darkTextOnHover
                                    buttonColor={"lightgreen"}
                                    sx={{flex: 1}}
                                    onClick={() => setRecruitModalOpen(true)}
                                >
                                    Contratar
                                </DefaultButton>
                            }

                            {(!editMode && canEdit) && <DefaultButton
                                buttonColor={"cyan"}
                                darkTextOnHover
                                sx={{flex: 1}}
                                onClick={() => setEditMode(true)}>Editar
                            </DefaultButton>}

                            {(!editMode && canEdit) &&
                                <DefaultButton
                                        buttonColor={"red"}
                                        sx={{flex: 1}}
                                        onClick={() => setFireModalOpen(true)}
                                    >
                                        Despedir
                                    </DefaultButton>
                            }
                        </div>
                    </div>

                    {/*@ts-ignore*/}
                    <form id={"information-form"} onSubmit={updateOfficerInfo}>
                        {/*Loader Div*/}
                        <div className={style.officerInfoDetailsDiv} style={{
                            justifyContent: "center",
                            alignItems: "center", display: `${loading ? "flex" : "none"}`
                        }}>
                            <Loader/>
                        </div>

                        {/*Information div*/}
                        <div className={style.officerInfoDetailsDiv} style={loading ? {display: "none"} : {}}>
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
                                        {/*@ts-ignore*/}
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
                                        {/*@ts-ignore*/}
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

            <AccountInformationModal
                open={isAccountModalOpen}
                onClose={() => setAccountModalOpen(false)}
                officerNif={officerNif}
                officerFullName={`${getPatentFromId(officerInfo.professional.patent, forceData.patents)?.name} ${officerInfo.personal.name}`}
            />

            <RecruitModal
            open={isRecruitModalOpen}
            onClose={() => setRecruitModalOpen(false)}
            />

            <FireModal
                open={isFireModalOpen}
                onClose={() => setFireModalOpen(false)}
                officerFullName={`${getPatentFromId(officerInfo.professional.patent, forceData.patents)?.name} ${officerInfo.personal.name}`}
                officerNif={officerNif}
            />
        </>
    )
}

export default OfficerInfo;