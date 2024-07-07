import React, {Component} from "react";
import style from "./officerinfo.module.css";
import modalsStyle from "./officerinfomodals.module.css";
import OfficerList from "../../components/OfficerList/officer-list";
import Loader from "../../components/Loader/loader";
import {Modal, ModalSection} from "../../components/Modal/modal";
import {make_request} from "../../utils/requests";
import {base_url} from "../../utils/constants";
import {
    Button,
    Divider,
    FormControlLabel, Menu,
    MenuItem,
    Select,
    Switch,
    TextField,
} from "@mui/material";
import {styled} from  "@mui/material/styles"
import ScreenSplit from "../../components/ScreenSplit/screen-split";

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

const StyledSelect = styled(Select)(({theme}) => ({
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

const StyledInput = styled(TextField)(({theme}) => ({
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


class RecruitModal extends Component {
    constructor(props) {
        super(props);

        // Check if a trigger is present
        if (!props.trigger) {
            console.error("No trigger was passed to the RecruitModal component");
            return;
        }

        this.state = {
            name: "",
            nif: "",
            phone: "",
            iban: "",
            kms: 0,
            discord: "",
            steam: "",

            recruit: false
        }

        this.recruitMember = this.recruitMember.bind(this);
    }

    async recruitMember(event) {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await make_request(`/officerInfo/${this.state.nif}${this.state.recruit ? "?recruit": ""}`, "PUT", this.state);

        // Check if the response is ok
        if (!recruitRequest.ok) {
            alert((await recruitRequest.json()).message);
            return;
        }

        // After recruiting the new member, we can reload the page using the officer's nif as a query param
        window.location = `${base_url}/efetivos?nif=${this.info.nif}`;
    }

    render () {
        return (
            <Modal width={"37%"} trigger={this.props.trigger} title={"Recrutar novo efetivo"} modal>
                <form onSubmit={this.recruitMember}>
                    <ModalSection title={"Informações Pessoais"}>
                        <div className={modalsStyle.formDiv}>
                            {/* TODO: add proper titles to explain the custom patterns */}
                            <StyledInput
                                variant={"standard"}
                                fullWidth
                                label={"Nome"}
                                type={"text"}
                                onChange={(event) => {
                                    this.setState({
                                        name: event.target.value
                                    });
                                }}
                                error={this.state.name !== "" && !(/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/.test(this.state.name))}
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
                                onChange={(event) => {
                                    this.setState({
                                        nif: event.target.value
                                    });
                                }}
                                error={this.state.nif !== "" && !(/^[0-9]{7,9}$/.test(this.state.nif))}
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
                                onChange={(event) => {
                                    this.setState({
                                        phone: event.target.value
                                    });
                                }}
                                error={this.state.phone !== "" && !(/^[0-9]{9}$/.test(this.state.phone))}
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
                                onChange={(event) => {
                                    this.setState({
                                        iban: event.target.value
                                    });
                                }}
                                error={this.state.iban !== "" && !(/^PT[0-9]{5,8}$/.test(this.state.iban))}
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
                                onChange={(event) => {
                                    this.setState({
                                       kms: event.target.value
                                    });
                                }}
                                sx={{margin: "10px 0 0 0"}}
                                required
                            />

                            <StyledInput
                                variant={"standard"}
                                fullWidth
                                label={"Discord ID"}
                                type={"text"}
                                onChange={(event) => {
                                    this.setState({
                                       discord: event.target.value
                                    });
                                }}
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
                                onChange={(event) => {
                                    this.setState({
                                        steam: event.target.value
                                    });
                                }}
                                sx={{margin: "10px 0 0 0"}}
                                error={this.state.steam !== "" && !(/^steam:[0-9]{9}$/.test(this.state.steam)) && !(/^http(s)?:\/\/steamcommunity.com\/id\/.+/.test(this.state.steam))}
                                required
                                inputProps={{
                                    name: "officerSteam"
                                }}
                            />

                            <FormControlLabel
                                control={<Switch
                                    onChange={(event) => {
                                        this.setState({
                                            recruit: event.target.checked
                                        });
                                    }}
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
}

class FireModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            fireReason: ""
        }

        this.fireOfficer = this.fireOfficer.bind(this);
    }

    async fireOfficer(event) {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        const fireRequest = await make_request(
            `/officerInfo/${this.props.officerNIF}`,
            "DELETE", {reason: this.state.fireReason}
        );

        // Check if the response is ok
        if (!fireRequest.ok) {
            alert((await fireRequest.json()).message);
            return;
        }

        // After firing the officer, we can reload the page to the officer's list
        window.location = `${base_url}/efetivos`;
    }

    render() {
        return (
            <Modal
                trigger={this.props.trigger}
                title={`Despedir ${this.props.officerFullName}`}
            >
                <form onSubmit={this.fireOfficer}>
                    <div className={modalsStyle.formDiv}>
                        {/*Text area to input the firing reason*/}
                        <ModalSection title={"Dados do Despedimento"}>
                            <TextField
                                label={"Motivo"}
                                fullWidth
                                multiline
                                maxRows={5}
                                className={modalsStyle.fireTextArea}
                                value={this.state.fireReason}
                                onChange={(event) => {
                                    this.setState({
                                        fireReason: `${event.target.value}`
                                    });
                                }}
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
        )

    }
}

const InformationPair = ({label, value, type = "text", pattern, editMode, onChange, step, isSelect = false, children}) => {
    // Sanitaze the pattern to be conpatible with the input pattern attribute
    let safePattern = pattern;
    if (pattern !== undefined) {
        let stringPattern = pattern.toString();
        if (stringPattern[0] === "/" && stringPattern[stringPattern.length - 1] === "/") {
            safePattern = stringPattern.substring(1, stringPattern.length - 1);
        }
    }

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
                    error={(pattern !== undefined) && !(pattern.test(value))}
                    value={value}
                    onChange={onChange}
                    inputProps={{
                        step: step,
                        pattern: safePattern
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
                onChange={onChange}
                slotProps={OfficerInfoSelectSlotProps}
            >
                {children}
            </StyledSelect>
        </div>
    );

}

class OfficerInfo extends Component {
    constructor(props) {
        super(props);

        this.editIntents = false;
        this.loggedPatent = null;

        this.patents = [];
        this.statuses = [];
        this.specialUnits = [];
        this.unitsRoles = [];

        this.state = {
            loading: true,
            editMode: false,
            hasEditPermissions: false,

            officerInfo: {
                personal: {
                    name: null,
                    nif: null,
                    phone: null,
                    iban: null,
                    kms: null,
                    discord: null,
                    steam: null,
                },
                professional: {
                    patent: null,
                    callsign: null,
                    entry_date: null,
                    promotion_date: null,
                    status: null,
                    special_units: []
                }
            }
        }

        this.fetchOfficerInfo = this.fetchOfficerInfo.bind(this);
        this.officerListCallback = this.officerListCallback.bind(this);
        this.enableEditMode = this.enableEditMode.bind(this);
        this.doesUserBelongToUnit = this.doesUserBelongToUnit.bind(this);
        this.getUnitNameFromId = this.getUnitNameFromId.bind(this);
        this.updateOfficerInfo = this.updateOfficerInfo.bind(this);
        this.handleInformationChange = this.handleInformationChange.bind(this);
    }

    async fetchOfficerInfo(nif) {
        // First, we need to set the loading state to true if not already
        if (!this.state.loading)
            this.setState({
                loading: true
            });

        const response = await make_request(`/officerInfo/${nif}?raw`, "GET");

        const responseJson = await response.json();

        // Check if the response is ok
        if (!response.ok) {
            alert(responseJson.message);
            console.error(responseJson.message);
            return;
        }

        // Fetch the actual data from the response
        const data = responseJson.data;

        // Apply the data to the officerInfo object
        this.setState({
           officerInfo: {
               ...this.state.officerInfo, // Spread the current object

               personal: {
                   name: data.name,
                   nif: data.nif,
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
           }
        });

        // If the logged user has edit permissions, check if it's lower than the officer's patente
        if (this.editIntents) {
            this.setState({
                hasEditPermissions: this.loggedPatent > data.patent
            });
        }

        // After fetching the data, we can set the loading state to false
        this.setState({
            loading: false
        });
    }

    async updateOfficerInfo(event) {
        // Prevent the form from submitting and therefore reloading the page
        event.preventDefault();

        // We need to set the loading state to true if not already and use the same call to set the hadEditPermissions to false and thus hide the edit and fire buttons until permissions are calculated again
        if (!this.state.loading)
            this.setState({
                loading: true,
                hadEditPermissions: false
            });

        // Make the request to update the officer's info
        const updateRequest = await make_request(`/officerInfo/${this.state.officerInfo.personal.nif}`, "PATCH",
            {
            // Personal Info
            name: this.state.officerInfo.personal.name,
            phone: this.state.officerInfo.personal.phone,
            iban: this.state.officerInfo.personal.iban,
            kms: this.state.officerInfo.personal.kms,
            discord: this.state.officerInfo.personal.discord,
            steam: this.state.officerInfo.personal.steam,

            // Professional Info
            patent: this.state.officerInfo.professional.patent,
            callsign: this.state.officerInfo.professional.callsign,
            status: this.state.officerInfo.professional.status,
            entry_date: this.state.officerInfo.professional.entry_date,
            promotion_date: this.state.officerInfo.professional.promotion_date,

            // Special Units
            special_units: this.state.officerInfo.professional.special_units
        });

        // Check if the response is ok
        if (!updateRequest.ok) {
            alert((await updateRequest.json()).message);
            return;
        }

        // After updating the data, we can reload the page using the officer's nif as a query param
        window.location = `${base_url}/efetivos?nif=${this.state.officerInfo.personal.nif}`;
    }

    async componentDidMount() {
        // TODO: make this in a separate function to be better organize this function
        // First, we need to check if the user has edit permissions
        const editIntentsResponse = await make_request("/account/validateToken", "POST", {intent: "officer"});

        // Make sure the response is OK
        if (!editIntentsResponse.ok) {
            return;
        }

        // Since the response is OK, we can set the editIntents to true and fetch the officers patent
        this.editIntents = true;
        const loggedNif = (await editIntentsResponse.json()).data

        // Get the logged officers's patent as an int
        const loggedOfficerResponse = await make_request(`/officerInfo/${loggedNif}?raw`, "GET");

        if (!loggedOfficerResponse.ok) {
            return;
        }

        this.loggedPatent = (await loggedOfficerResponse.json()).data.patent;


        // TODO: make this in a separate function to be better organize this function
        // When the page loads, we need to fetch the available patents and statuses
        const patentsResponse = await make_request("/util/patents", "GET");

        // Mandatory check if the status code was 200
        // TODO: Do something actually useful with the error
        if (!patentsResponse.ok) {
            return;
        }

        // Apply the data to the class object
        this.patents = (await patentsResponse.json()).data;

        const statusResponse = await make_request("/util/statuses", "GET");

        // Mandatory check if the status code was 200
        // TODO: Do something actually useful with the error
        if (!statusResponse.ok) {
            return;
        }

        // Apply the data to the class object
        this.statuses = (await statusResponse.json()).data;

        const specialUnitsResponse = await make_request("/util/specialunits", "GET");

        // Mandatory check if the status code was 200
        // TODO: Do something actually useful with the error
        if (!specialUnitsResponse.ok)
            return;

        const specialUnitsResponseJson = await specialUnitsResponse.json();

        // Apply the units and their roles to the objects of the class
        this.specialUnits = specialUnitsResponseJson.data["units"];
        this.unitsRoles = specialUnitsResponseJson.data["roles"];


        // Checking if there's a nif in the query params to instantly load the officer's info
        const queryParams = new URLSearchParams(window.location.search);
        const queryNif = queryParams.get("nif");
        if (queryNif) {
            this.fetchOfficerInfo(queryNif).then(() => {});
        } else {
            this.fetchOfficerInfo(loggedNif).then(() => {});
        }
    }

    getUnitNameFromId(unitId) {
        for (let unit of this.specialUnits) {
            if (unit.id === unitId) {
                return unit.name;
            }
        }
    }

    doesUserBelongToUnit(unit_id) {
        for (let unit of this.state.officerInfo.professional.special_units) {
            if (unit.id === unit_id) {
                return true;
            }
        }
        return false;
    }

    officerListCallback(nif) {
        this.setState({
            editMode: false,
        });

        this.fetchOfficerInfo(nif).then(() => {});
    }

    enableEditMode() {
        this.setState({
            editMode: true
        });
    }

    handleInformationChange(category, info, value) {
        this.setState({
            officerInfo: {
                ...this.state.officerInfo,
                [category]: {
                    ...this.state.officerInfo[category],
                    [info]: value
                }
            }

        })
    }

    render() {
        // Before rendering the page, we need to build the patentes and status options
        const patentesOptions = this.patents.map((patent) => {
            return <MenuItem key={`patent${patent.id}`} value={patent.id} disabled={patent.id > this.loggedPatent}>{patent.name}</MenuItem>
        });

        const statusOptions = this.statuses.map((status) => {
           return <MenuItem key={`status${status.id}`} value={status.id}>{status.name}</MenuItem>
        });

        const specialUnitsOptions = this.specialUnits.map((unit) => {
           if (!this.doesUserBelongToUnit(unit.id))
               return <option key={`unit${unit.id}`} value={unit.id}>{unit.name}</option>
        });

        const specialUnitsRolesOptions = this.unitsRoles.map((role) => {
            return <option key={`role${role.id}`} value={role.id}>{role.name}</option>
        });

        return(
            <div>
                {/*Div that splits the screen*/}
                <ScreenSplit
                    leftSidePercentage={30}
                    leftSideComponent={<OfficerList callbackFunction={this.officerListCallback}/>}
                >
                    {/*Div where content's will be*/}
                    <div className={style.officerInfoInnerDiv}>
                        {/*Div that holds the buttons to alter the officer's info*/}
                        <div className={style.officerInfoAlterbarDiv}>
                            <button type={"submit"} form={"information-form"}
                                    className={[style.officerInfoAlterButton, style.officerInfoAlterButtonSave].join(" ")}
                                    hidden={!this.state.editMode}>Guardar
                            </button>

                            <RecruitModal trigger={<button
                                className={[style.officerInfoAlterButton, style.officerInfoAlterButtonCreate].join(" ")}
                                hidden={this.state.editMode || !this.editIntents}>Recrutar</button>}></RecruitModal>

                            <button
                                className={[style.officerInfoAlterButton, style.officerInfoAlterButtonEdit].join(" ")}
                                hidden={this.state.editMode || !this.state.hasEditPermissions}
                                onClick={this.enableEditMode}>Editar
                            </button>

                            <FireModal trigger={<button
                                className={[style.officerInfoAlterButton, style.officerInfoAlterButtonDelete].join(" ")}
                                hidden={this.state.editMode || !this.state.hasEditPermissions}>Despedir</button>} officerFullName={`${this.state.loading ? "Agente": (this.patents[this.state.officerInfo.professional.patent + 1]["name"])} ${this.state.officerInfo.personal.name}`} officerNIF={this.state.officerInfo.personal.nif}></FireModal>

                            {/* TODO: This button should only appear when the logged user has the "accounts" intent. Class and functionality needs to be done */}
                            <button
                                className={[style.officerInfoAlterButton, style.officerInfoAlterButtonImport].join(" ")}
                                style={{float: "left"}} hidden={this.state.editMode || !this.editIntents}>Gerir
                                Conta
                            </button>
                            <button
                                className={[style.officerInfoAlterButton, style.officerInfoAlterButtonImport].join(" ")}
                                style={{float: "left"}} hidden={this.state.editMode || !this.editIntents}>Importar
                                do HUB
                            </button>
                        </div>

                        {/*TODO: This form isn't validanting the inputs*/}
                        <form id={"information-form"} onSubmit={this.updateOfficerInfo}>
                            {/*Loader Div*/}
                            <div className={style.officerInfoDetailsDiv} style={{
                                justifyContent: "center",
                                alignItems: "center", display: `${this.state.loading ? "flex": "none"}`}}>
                                <Loader/>
                            </div>

                            {/*Information div*/}
                            <div className={style.officerInfoDetailsDiv} style={this.state.loading ? {display: "none"}: {}}>
                                <fieldset>
                                    <legend>Informação Pessoal</legend>

                                    <div className={style.officerInfoInnerFieldsetDiv}>
                                        {/*Name pair*/}
                                        {/*Pattern Unit tests: https://regex101.com/r/pdl46q/1*/}
                                        <InformationPair
                                            label={"Nome:"}
                                            value={this.state.officerInfo.personal.name}
                                            pattern={/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("personal", "name", event.target.value)}
                                        />
                                        <Divider flexItem/>

                                        {/*NIF pair*/}
                                        <InformationPair
                                            label={"NIF:"}
                                            value={this.state.officerInfo.personal.nif}
                                            editMode={false}
                                        />
                                        <Divider flexItem/>

                                        {/*Cellphone pair*/}
                                        <InformationPair
                                            label={"Telemóvel:"}
                                            value={this.state.officerInfo.personal.phone}
                                            pattern={/^[0-9]{9}$/}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("personal", "phone", event.target.value)}
                                        />
                                        <Divider flexItem/>

                                        {/*IBAN pair*/}
                                        <InformationPair
                                            label={"IBAN:"}
                                            value={this.state.officerInfo.personal.iban}
                                            pattern={/^PT[0-9]{3,6}$/}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("personal", "iban", event.target.value)}
                                        />
                                        <Divider flexItem/>

                                        {/*KMs pair*/}
                                        <InformationPair
                                            label={"KMs:"}
                                            value={this.state.officerInfo.personal.kms}
                                            editMode={this.state.editMode}
                                            type={"number"}
                                            step={100}
                                            onChange={(event) => this.handleInformationChange("personal", "kms", event.target.value)}
                                        />
                                        <Divider flexItem/>

                                        {/*Discord pair*/}
                                        <InformationPair
                                            label={"Discord:"}
                                            value={this.state.officerInfo.personal.discord}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("personal", "discord", event.target.value)}
                                        />
                                        <Divider flexItem/>

                                        {/*Steam pair*/}
                                        {/*Pattern Unit tests: https://regex101.com/r/cZ5DjR/2*/}
                                        <InformationPair
                                            label={"Steam:"}
                                            value={this.state.officerInfo.personal.steam}
                                            pattern={/^steam:([0-9]|[a-z])+$|^http(s)?:\/\/steamcommunity\.com\/id\/.+/}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("personal", "steam", event.target.value)}
                                        />
                                    </div>
                                </fieldset>

                                <fieldset>
                                    <legend>Informação Profissional</legend>

                                    <div className={style.officerInfoInnerFieldsetDiv}>
                                        {/*Patente pair*/}
                                        <InformationPair
                                            label={"Patente:"}
                                            value={this.state.officerInfo.professional.patent}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("professional", "patent", event.target.value)}
                                            isSelect
                                        >
                                            {patentesOptions}
                                        </InformationPair>
                                        <Divider/>

                                        {/*CallSign pair*/}
                                        <InformationPair
                                            label={"CallSign:"}
                                            value={this.state.officerInfo.professional.callsign}
                                            pattern={/^[FSTODCZAG]-([0-9]){2}$/}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("professional", "callsign", event.target.value)}
                                        />
                                        <Divider/>

                                        {/*Status pair*/}
                                        <InformationPair
                                            label={"Status:"}
                                            value={this.state.officerInfo.professional.status}
                                            isSelect
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("professional", "status", event.target.value)}
                                        >
                                            {statusOptions}
                                        </InformationPair>
                                        <Divider/>

                                            {/*Data de Entrada pair*/}
                                            <InformationPair
                                                label={"Data de Entrada:"}
                                                value={this.state.officerInfo.professional.entry_date}
                                                type={"date"}
                                                editMode={this.state.editMode}
                                                onChange={(event) => this.handleInformationChange("professional", "entry_date", event.target.value)}
                                            />
                                            <Divider/>
                                        {/*Data de Entrada pair*/}
                                        <InformationPair
                                            label={"Data de Entrada:"}
                                            value={this.state.officerInfo.professional.entry_date}
                                            type={"date"}
                                            editMode={this.state.editMode}
                                            onChange={(event) => this.handleInformationChange("professional", "entry_date", event.target.value)}
                                        />
                                        <Divider/>

                                        {/*Data de Subida pair*/}
                                        <InformationPair
                                            label={"Data de Subida:"}
                                            value={this.state.officerInfo.professional.promotion_date}
                                            type={"date"}
                                            editMode={false}
                                        />
                                        <Divider/>

                                            {/*Unidades Especiais*/}
                                            <div>
                                                <label className={style.informationPairLabel}>Unidades
                                                    Especiais:</label>
                                                <table className={style.officerInfoUnitsTable}>
                                                    <thead>
                                                    <tr>
                                                        <th style={{width: "50%"}}>Unidade</th>
                                                        <th>Cargo</th>
                                                        <th hidden={!this.state.editMode}>Ação</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {this.state.officerInfo.professional.special_units.map((unit) => {
                                                        return <tr key={`unit${unit.id}`}>
                                                            <td style={{fontSize: "0.8rem"}}>{this.getUnitNameFromId(unit.id)}</td>
                                                            <td><select className={style.officerInfoUnitsSelect}
                                                                        value={unit.role} onChange={(event) => {
                                                                // Update the unit's role
                                                                let current_units = this.state.officerInfo.professional.special_units;
                                                                const index = current_units.indexOf(unit);
                                                                current_units[index].role = parseInt(event.target.value);

                                                                this.setState({
                                                                    officerInfo: {
                                                                        ...this.state.officerInfo,
                                                                        professional: {
                                                                            ...this.state.officerInfo.professional,
                                                                            special_units: current_units
                                                                        }
                                                                    }
                                                                });
                                                            }}>
                                                                {specialUnitsRolesOptions}
                                                            </select></td>
                                                            <td hidden={!this.state.editMode}>
                                                                <button type={"button"} onClick={() => {
                                                                    let current_units = this.state.officerInfo.professional.special_units;
                                                                    const index = current_units.indexOf(unit);
                                                                    current_units.splice(index, 1);
                                                                    this.setState({
                                                                        officerInfo: {
                                                                            ...this.state.officerInfo,
                                                                            professional: {
                                                                                ...this.state.officerInfo.professional,
                                                                                special_units: current_units
                                                                            }
                                                                        }
                                                                    });
                                                                }}>Remover
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    })}
                                                    </tbody>
                                                    <tfoot
                                                        hidden={!this.state.editMode}> {/*Only show the add button if the edit mode is enabled*/}
                                                    <tr>
                                                        <td><select id={"officerInfoNewUnitValue"}>
                                                            {specialUnitsOptions}
                                                        </select></td>
                                                        <td><select id={"officerInfoNewUnitRole"}>
                                                            {specialUnitsRolesOptions}
                                                        </select></td>
                                                        <td>
                                                            <button type={"button"} onClick={() => {
                                                                // Add the unit to the state
                                                                let current_units = this.state.officerInfo.professional.special_units;
                                                                console.log(JSON.stringify(current_units));
                                                                current_units.push({
                                                                    id: parseInt(document.getElementById("officerInfoNewUnitValue").value),
                                                                    role: parseInt(document.getElementById("officerInfoNewUnitRole").value)
                                                                });
                                                                console.log("Pushed new unit")
                                                                console.log(JSON.stringify(current_units));
                                                                this.setState({
                                                                    officerInfo: {
                                                                        ...this.state.officerInfo,
                                                                        professional: {
                                                                            ...this.state.officerInfo.professional,
                                                                            special_units: current_units
                                                                        }
                                                                    }
                                                                });
                                                            }}>Adicionar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    </tfoot>
                                                </table>
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
}

export default OfficerInfo;