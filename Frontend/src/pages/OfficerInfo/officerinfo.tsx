import React, {ChangeEvent, ReactNode, useContext, useEffect, useState} from "react";
import style from "./officerinfo.module.css";
import OfficerList from "../../components/OfficerList/officer-list";
import Loader from "../../components/Loader/loader";
import {make_request} from "../../utils/requests";
import {
    Divider,
    MenuItem
} from "@mui/material";
import ScreenSplit from "../../components/ScreenSplit/screen-split";
import {LoggedUserContext} from "../../components/PrivateRoute/logged-user-context.ts";
import {useParams} from "react-router-dom";
import {getObjectFromId} from "../../forces-data-context.ts";
import {toast} from "react-toastify";
import {useImmer} from "use-immer";
import {
    DefaultButton,
    DefaultSelect,
    DefaultTextField
} from "../../components/DefaultComponents";
import {OfficerData, OfficerInfoGetResponse, OfficerUnit} from "@portalseguranca/api-types/officers/output";
import {RecruitModal, FireModal, AccountInformationModal} from "./modals";
import SpecialUnitsTable from "./special-units-table.tsx";
import Gate from "../../components/Gate/gate.tsx";
import {ActivityPanel} from "./activity-panel.tsx";
import ManagementBar from "../../components/ManagementBar";
import { UpdateOfficerRequestBody } from "@portalseguranca/api-types/officers/input.ts";
import { RequestError } from "@portalseguranca/api-types/index.ts";
import {useForceData} from "../../hooks";


type InformationPairProps = {
    label: string,
    value: string | number,
    type?: string,
    pattern?: RegExp,
    editMode: boolean,
    onChangeCallback?: ((event: ChangeEvent<HTMLInputElement>) => void) | any,
    step?: number,
    isSelect?: boolean,
    children?: ReactNode | ReactNode[]
}
const InformationPair = ({label, value, type = "text", pattern, editMode, onChangeCallback, step, isSelect = false, children}: InformationPairProps): ReactNode => {

    // If it's not a select, return a basic input
    if (!isSelect) {
        return (
            <div className={style.informationPairDiv}>
                <label>{label}</label>
                <DefaultTextField
                    fullWidth
                    required
                    textWhenDisabled
                    disabled={!editMode}
                    type={type}
                    error={(pattern !== undefined) && !(pattern.test(String(value)))}
                    value={value === null ? "": value}
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



function OfficerInfo() {
    // Type declaration for the OfficerInfo state
    type OfficerInfoState = {
        personal: {
            name: string,
            phone: number,
            iban: string,
            kms: number,
            discord: number,
            steam: string
        },
        professional: {
            patent: number,
            callsign: string,
            status: number,
            entry_date: string,
            promotion_date: string | null,
            special_units: OfficerUnit[]
        }
    }

    // Variable that will hold the logged user information from context
    const loggedUser = useContext(LoggedUserContext);

    // Get the nif from the URL params
    // ! This might not be present
    let {nif} = useParams();

    // State that controls the loading state of the page
    const [loading, setLoading] = useState<boolean>(true);

    // State that controls the edit mode of the page
    const [editMode, setEditMode] = useState<boolean>(false);

    // Get all of the force's constant data
    const [forceData] = useForceData();

    // State variable that holds the officer's info
    const [officerNif, setOfficerNif] = useState<number>((nif ? Number(nif): false) || loggedUser.info.personal.nif);
    const [officerInfo, setOfficerInfo] = useImmer<OfficerInfoState>({
        personal: {
            discord: 0,
            iban: "",
            kms: 0,
            name: "",
            phone: 0,
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
        // First, we need to set the loading state to true
        setLoading(true);

        // Then, disable edit mode
        setEditMode(false);

        const response = await make_request(`/officers/${officerNif}`, "GET");

        // Check if the response is 404. If it is, most likely the user has inputted an non existing nif in param
        if (response.status === 404) {
            toast("O NIF inserido não corresponde a nenhum efetivo.", {type: "error"});
            return setOfficerNif(loggedUser.info.personal.nif); // Set the active nif as the logged user
        }

        // Convert the received data to JSON and fetch the actual data
        const responseJson: OfficerInfoGetResponse = await response.json();

        if (responseJson.meta.former && !loggedUser.intents["officers"]) {
            toast("O NIF inserido não corresponde a nenhum efetivo.", {type: "error"});
            return setOfficerNif(loggedUser.info.personal.nif); // Set the active nif as the logged user
        }

        const data = responseJson.data as OfficerData;

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
        const updateRequest = await make_request<UpdateOfficerRequestBody>(`/officers/${officerNif}`, "PATCH",
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

                    // Special Units
                    special_units: officerInfo.professional.special_units
                }
        });

        // Check if the response is ok
        if (!updateRequest.ok) {
            toast.error(((await updateRequest.json()) as RequestError).message);
            return;
        }

        // After updating the data, we can show a notification and reload the info of the edit officer
        toast("Informações atualizadas com sucesso!", {type: "success"});
        await fetchOfficerInfo();
    }

    // Whenever the nif in state changes, we need to fetch the officer's info
    useEffect(() => {fetchOfficerInfo()}, [officerNif]);

    function officerListCallback(nif: number) {
        // Make sure we don't change officer's while editing
        setEditMode(false);

        // Change the nif in state so useEffect can handle the info fetching
        setOfficerNif(nif);
    }

    function handleSpecialUnitEdit(specialUnit: OfficerUnit) {
        // Get to the special unit in the array
        const specialUnitIndex = officerInfo.professional.special_units.findIndex((unit: OfficerUnit) => unit.id === specialUnit.id);

        // If the special unit is not found, return
        if (specialUnitIndex === -1) return;

        // Update the special unit in the array
        setOfficerInfo(draft => {
            draft.professional.special_units[specialUnitIndex] = specialUnit;
        });
    }

    function handleSpecialUnitRemove(specialUnit: OfficerUnit) {
        // Get the special unit index
        const specialUnitIndex = officerInfo.professional.special_units.findIndex((unit: OfficerUnit) => unit.id === specialUnit.id);

        // If the special unit is not found, return
        if (specialUnitIndex === -1) return;

        // Remove the special unit from the array
        setOfficerInfo(draft => {
            draft.professional.special_units.splice(specialUnitIndex, 1);
        });
    }

    function handleSpecialUnitAdd(newUnit: OfficerUnit) {
        // Get the new unit's index
        const newUnitIndex = officerInfo.professional.special_units.findIndex((unit: OfficerUnit) => unit.id === newUnit.id);

        // If the new unit is already in the array, return
        if (newUnitIndex !== -1) return;

        // Add the new unit to the array
        setOfficerInfo(draft => {
            draft.professional.special_units.push(newUnit);
        });
    }

    return (
        <>
            {/*Div that splits the screen*/}
            <ScreenSplit
                leftSidePercentage={30}
                leftSideComponent={<OfficerList callbackFunction={officerListCallback} disabled={loading}/>}
            >
                {/*Div where content's will be*/}
                <div className={style.officerInfoInnerDiv}>
                    {/*Div that holds the buttons to alter the officer's info*/}
                    <ManagementBar>
                        {/*Buttons that lie on the left side of the bar*/}
                        <div className={style.officerInfoAlterbarLeft}>
                            <Gate show={!editMode && loggedUser.intents.accounts && loggedUser.info.professional.patent > officerInfo.professional.patent}>
                                <DefaultButton
                                    onClick={() => setAccountModalOpen(true)}
                                >
                                    Gerir Conta
                                </DefaultButton>
                            </Gate>
                            <DefaultButton
                                hidden={editMode || !loggedUser.intents.officers}
                            >
                                Importar do HUB
                            </DefaultButton>
                        </div>

                        {/*Buttons that lie on the right side of the bar*/}
                        <div className={style.officerInfoAlterbarRight}>
                            <Gate show={editMode}>
                                <DefaultButton
                                    type={"submit"}
                                    form={"information-form"}
                                    sx={{flex: 1}}
                                >
                                    Guardar
                                </DefaultButton>
                            </Gate>

                            <Gate show={!editMode && loggedUser.intents.officers}>
                                <DefaultButton
                                    darkTextOnHover
                                    buttonColor={"lightgreen"}
                                    sx={{flex: 1}}
                                    onClick={() => setRecruitModalOpen(true)}
                                >
                                    Contratar
                                </DefaultButton>
                            </Gate>

                            <Gate show={!editMode && canEdit}>
                                <DefaultButton
                                    buttonColor={"cyan"}
                                    darkTextOnHover
                                    sx={{flex: 1}}
                                    onClick={() => setEditMode(true)}
                                >
                                    Editar
                                </DefaultButton>
                            </Gate>

                            <Gate show={!editMode && canEdit}>
                                <DefaultButton
                                    buttonColor={"red"}
                                    sx={{flex: 1}}
                                    onClick={() => setFireModalOpen(true)}
                                >
                                    Despedir
                                </DefaultButton>
                            </Gate>
                        </div>
                    </ManagementBar>

                    {/*@ts-ignore*/}
                    <form id={"information-form"} onSubmit={updateOfficerInfo}>
                        {/*Loader Div*/}
                        <Gate show={loading}>
                            <div className={style.officerInfoDetailsDiv} style={{
                                justifyContent: "center",
                                alignItems: "center"
                            }}>
                                <Loader/>
                            </div>
                        </Gate>

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
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.personal.name = event.target.value
                                        })}
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
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.personal.phone = Number(event.target.value)
                                        })}
                                    />
                                    <Divider flexItem/>

                                    {/*IBAN pair*/}
                                    <InformationPair
                                        label={"IBAN:"}
                                        value={officerInfo.personal.iban}
                                        pattern={/^PT[0-9]{5,8}$/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.personal.iban = event.target.value
                                        })}
                                    />
                                    <Divider flexItem/>

                                    {/*KMs pair*/}
                                    <InformationPair
                                        label={"KMs:"}
                                        value={officerInfo.personal.kms}
                                        editMode={editMode}
                                        type={"number"}
                                        step={100}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.personal.kms = Number(event.target.value)
                                        })}
                                    />
                                    <Divider flexItem/>

                                    {/*Discord pair*/}
                                    <InformationPair
                                        label={"Discord:"}
                                        value={officerInfo.personal.discord}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.personal.discord = Number(event.target.value)
                                        })}
                                    />
                                    <Divider flexItem/>

                                    {/*Steam pair*/}
                                    {/*Pattern Unit tests: https://regex101.com/r/cZ5DjR/2*/}
                                    <InformationPair
                                        label={"Steam:"}
                                        value={officerInfo.personal.steam}
                                        pattern={/(^steam:([0-9]|[a-z])+$)|(^http(s)?:\/\/steamcommunity\.com\/id\/.+$)/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.personal.steam = event.target.value
                                        })}
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
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                           draft.professional.patent = Number(event.target.value)
                                        })}
                                        isSelect
                                    >
                                        {forceData.patents.map((patent) => {
                                            return <MenuItem key={`patent${patent.id}`} value={patent.id} disabled={patent.id > loggedUser.info.professional.patent}>{patent.name}</MenuItem>
                                        })}
                                    </InformationPair>
                                    <Divider/>

                                    {/*CallSign pair*/}
                                    <InformationPair
                                        label={"CallSign:"}
                                        value={officerInfo.professional.callsign}
                                        pattern={/^[A-Z]+-([0-9]){2}$/}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.professional.callsign = event.target.value
                                        })}
                                    />
                                    <Divider/>

                                    {/*Status pair*/}
                                    <InformationPair
                                        label={"Status:"}
                                        value={officerInfo.professional.status}
                                        isSelect
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.professional.status = Number(event.target.value)
                                        })}
                                    >
                                        {forceData.statuses.map((status: {id: number, name: string}) => {
                                            return <MenuItem key={`status${status.id}`} value={status.id}>{status.name}</MenuItem>
                                        })}
                                    </InformationPair>
                                    <Divider/>

                                    {/*Data de Entrada pair*/}
                                    <InformationPair
                                        label={"Data de Entrada:"}
                                        value={officerInfo.professional.entry_date}
                                        type={"date"}
                                        editMode={editMode}
                                        onChangeCallback={(event: ChangeEvent<HTMLInputElement>) => setOfficerInfo(draft => {
                                            draft.professional.entry_date = event.target.value
                                        })}
                                    />
                                    <Divider/>

                                    {/*Data de Subida pair*/}
                                    <InformationPair
                                        label={"Data de Subida:"}
                                        value={officerInfo.professional.promotion_date || ""}
                                        type={"date"}
                                        editMode={false}
                                    />

                                    {/*Unidades Especiais*/}
                                    <Gate show={editMode || officerInfo.professional.special_units.length !== 0}>
                                        <Divider/>

                                        <div className={style.informationPairDiv}>
                                            <label>Unidades Especiais:</label>
                                            <SpecialUnitsTable
                                                editMode={editMode}
                                                officerSpecialUnits={officerInfo.professional.special_units}
                                                onChange={handleSpecialUnitEdit}
                                                onRemove={handleSpecialUnitRemove}
                                                onAdd={handleSpecialUnitAdd}
                                            />
                                        </div>
                                    </Gate>
                                </div>
                            </fieldset>

                            <ActivityPanel nif={officerNif}/>

                            <fieldset>
                            <legend>Punições</legend>
                                <div style={{filter: "blur(5px)"}}>
                                    <p>Punição Ativa: <span></span>
                                    </p>
                                    <p>Histórico: <span></span>
                                    </p>
                                </div>
                            </fieldset>
                        </div>
                    </form>
                </div>
            </ScreenSplit>

            <AccountInformationModal
                open={isAccountModalOpen}
                onClose={() => setAccountModalOpen(false)}
                officerNif={officerNif}
                officerFullName={`${getObjectFromId(officerInfo.professional.patent, forceData.patents)?.name} ${officerInfo.personal.name}`}
            />

            <RecruitModal
            open={isRecruitModalOpen}
            onClose={() => setRecruitModalOpen(false)}
            />

            <FireModal
                open={isFireModalOpen}
                onClose={() => setFireModalOpen(false)}
                officerFullName={`${getObjectFromId(officerInfo.professional.patent, forceData.patents)?.name} ${officerInfo.personal.name}`}
                officerNif={officerNif}
            />
        </>
    )
}

export default OfficerInfo;