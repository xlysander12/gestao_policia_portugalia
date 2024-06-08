import React, {Component} from "react";
import style from "./officerinfo.module.css";
import modalsStyle from "./officerinfomodals.module.css";
import OfficerList from "../../components/OfficerList/officerlist";
import Loader from "../../components/Loader/loader";
import Modal from "../../components/Modal/Modal";
import {make_request} from "../../utils/requests";
import {base_url} from "../../utils/constants";
import {Divider, FormControl, FormControlLabel, MenuItem, Select, Switch, TextField} from "@mui/material";
import {styled} from  "@mui/material/styles"

const OfficerInfoSelectSlotProps = {
    root: {
        sx: {
            "label+&": {
                margin: 0
            },

            "&:before": {
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
            "&.Mui-disabled": {
                display: "none"
            },
        },

        "& .MuiInput-input": {
            "&.Mui-disabled": {
                WebkitTextFillColor: "black",
                WebkitUserSelect: "auto",
                userSelect: "auto"
            }
        }
}));

const StyledInput = styled(TextField)(({theme}) => ({
    "& .MuiInput-input": {
        WebkitTextFillColor: "#d0c7d3",
        fontWeight: "bold",
    },

    "& .MuiInput-input.Mui-disabled": {
        WebkitTextFillColor: "#d0c7d3",
    },

    "& .MuiInput-input.Mui-error": {
        borderBottomColor: "red"
    },

    "& .MuiInputBase-root": {
        "&:before": {
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

        this.info = {
            name: undefined,
            nif: undefined,
            phone: undefined,
            iban: undefined,
            kms: undefined,
            discord: undefined,
            steam: undefined,

            recruit: false
        }

        this.recruitMember = this.recruitMember.bind(this);
    }

    async recruitMember(event) {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await make_request(`/officerInfo/${this.info.nif}${this.info.recruit ? "?recruit": ""}`, "PUT", this.info);

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
                    <div className={modalsStyle.content}>
                        <form onSubmit={this.recruitMember}>
                            <div className={modalsStyle.formDiv}>
                                {/* TODO: add proper titles to explain the custom patterns */}
                                <label htmlFor={"recruitname"}>Nome:</label>
                                <input id={"recruitname"} name={"nome"} type={"text"} onChange={(event) => {this.info.name = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitnif"}>NIF:</label>
                                <input id={"recruitnif"} name={"nif"} type={"text"} pattern={"^[0-9]{9}$"} onChange={(event) => {this.info.nif = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitphone"}>Telemóvel:</label>
                                <input id={"recuitphone"} name={"telemovel"} type={"text"} pattern={"^[0-9]{9}$"} onChange={(event) => {this.info.phone = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitiban"}>IBAN:</label>
                                <input id={"recruitiban"} name={"iban"} type={"text"} pattern={"^PT[0-9]{5,8}$"} onChange={(event) => {this.info.iban = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitkms"}>KMs:</label>
                                <input id={"recruitkms"} name={"kms"} type={"number"} step={100} onChange={(event) => {this.info.kms = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitdiscord"}>Discord ID:</label>
                                <input id={"recruitdiscord"} name={"discord"} type={"text"} pattern={"[0-9]+"} onChange={(event) => {this.info.discord = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitsteam"}>Steam ID:</label>
                                <input id={"recruitsteam"} name={"steam"} type={"text"} pattern={"steam:.+"} onChange={(event) => {this.info.steam = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <FormControlLabel control={<Switch onChange={(event) => {
                                    this.info.recruit = event.target.checked;
                                }}/>} label={"Recrutar como Cadete"} />


                                <button className={modalsStyle.submitButton} type={"submit"}>Recrutar</button>
                            </div>
                        </form>
                    </div>
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
            <Modal trigger={this.props.trigger} title={`Despedir ${this.props.officerFullName}`}>
                <div className={modalsStyle.content}>
                    <form onSubmit={this.fireOfficer}>
                        <div className={modalsStyle.formDiv}>
                            {/*Text area to input the firing reason*/}
                            <TextField
                                label={"Motivo do despedimento"}
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

                            {/*Button to submit the form and, therefore, fire the officer*/}
                            <button className={modalsStyle.fireButton} type={"submit"}>Despedir</button>
                        </div>
                    </form>
                </div>
            </Modal>
        )

    }
}


class OfficerInfo extends Component {
    constructor(props) {
        super(props);

        this.editIntents = false;
        this.loggedPatent = undefined;

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
                {/*Navbar*/}
                {/*<Navbar path={[["Efetivos", ""]]}/>*/}

                {/*Div that splits the screen*/}
                <div style={{display: "flex"}}>

                    {/*Div that will hold the officer's list*/}
                    <div className={style.officerListDiv}>
                        <OfficerList callbackFunction={this.officerListCallback}/>
                    </div>

                    {/*Div that will hold the officer's info*/}
                    <div className={style.officerInfoOuterDiv}>

                        {/*Div where content's will be*/}
                        <div className={style.officerInfoInnerDiv}>
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

                                        {/*TODO: Add a notes field at the end of the pairs to compensate the excess height in the "proffisional information" tab.*/}
                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Name pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Nome:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    type={"text"}
                                                    error={!(/^([a-zA-Z ]|[à-ü ]|[À-Ü ])+$/.test(this.state.officerInfo.personal.name))}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.personal.name}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            officerInfo: {
                                                                ...this.state.officerInfo,
                                                                personal: {
                                                                    ...this.state.officerInfo.personal,
                                                                    name: event.target.value
                                                                }
                                                            }
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <Divider flexItem/>
                                            {/*NIF pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>NIF:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    className={style.officerInfoInput}
                                                    type={"text"}
                                                    value={this.state.officerInfo.personal.nif}
                                                    disabled
                                                />
                                            </div>
                                            <Divider flexItem/>
                                            {/*Cellphone pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Telemóvel:</label>
                                                <StyledInput
                                                    error={!(/^[0-9]{9}$/.test(this.state.officerInfo.personal.phone))}
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.personal.phone}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            officerInfo: {
                                                                ...this.state.officerInfo,
                                                                personal: {
                                                                    ...this.state.officerInfo.personal,
                                                                    phone: event.target.value
                                                                }
                                                            }
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <Divider flexItem/>
                                            {/*IBAN pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>IBAN:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    error={!(/^PT[0-9]{5,8}$/.test(this.state.officerInfo.personal.iban))}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.personal.iban}
                                                    onChange={(event) => {
                                                       this.setState({
                                                           officerInfo: {
                                                               ...this.state.officerInfo,
                                                               personal: {
                                                                   ...this.state.officerInfo.personal,
                                                                   iban: event.target.value
                                                               }
                                                           }
                                                       });
                                                   }}
                                                />
                                            </div>
                                            <Divider flexItem/>
                                            {/*KMs pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>KMs:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    type={"number"}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.personal.kms}
                                                    onChange={(event) => {
                                                        this.setState({
                                                           officerInfo: {
                                                               ...this.state.officerInfo,
                                                               personal: {
                                                                   ...this.state.officerInfo.personal,
                                                                   kms: event.target.value
                                                               }
                                                           }
                                                       });
                                                    }}
                                                />
                                            </div>
                                            <Divider flexItem/>
                                            {/*Discord pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Discord ID:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.personal.discord}
                                                    onChange={(event) => {
                                                       this.setState({
                                                           officerInfo: {
                                                               ...this.state.officerInfo,
                                                               personal: {
                                                                   ...this.state.officerInfo.personal,
                                                                   discord: event.target.value
                                                               }
                                                           }
                                                       });
                                                    }}
                                                />
                                            </div>
                                            <Divider flexItem/>
                                            {/*Steam pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Steam ID:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    error={this.state.officerInfo.personal.steam !== null && !(/^steam:.+/.test(this.state.officerInfo.personal.steam))}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.personal.steam}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            officerInfo: {
                                                                ...this.state.officerInfo,
                                                                personal: {
                                                                    ...this.state.officerInfo.personal,
                                                                    steam: event.target.value
                                                                }
                                                            }
                                                        });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </fieldset>

                                    <fieldset>
                                        <legend>Informação Profissional</legend>

                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Patente pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Patente:</label>
                                                <StyledSelect
                                                    className={style.officerInfoInputSelect}
                                                    value={this.state.officerInfo.professional.patent}
                                                    onChange={(event) => {
                                                        this.setState({
                                                            officerInfo: {
                                                                ...this.state.officerInfo,
                                                                professional: {
                                                                    ...this.state.officerInfo.professional,
                                                                    patent: event.target.value
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    slotProps={OfficerInfoSelectSlotProps}>
                                                    {patentesOptions}
                                                </StyledSelect>
                                            </div>
                                            <Divider/>
                                            {/*CallSign pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>CallSign:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    error={this.state.officerInfo.professional.callsign !== null && !(/^[FSTODCZAG]-([0-9]){2}$/.test(this.state.officerInfo.professional.callsign))}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.professional.callsign}
                                                    onChange={(event) => {
                                                       this.setState({
                                                           officerInfo: {
                                                               ...this.state.officerInfo,
                                                               professional: {
                                                                   ...this.state.officerInfo.professional,
                                                                   callsign: event.target.value
                                                               }
                                                           }
                                                       });
                                                   }}
                                                />
                                            </div>
                                            <Divider/>
                                            {/*Status pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Status:</label>
                                                <StyledSelect className={style.officerInfoInputSelect}
                                                        value={this.state.officerInfo.professional.status}
                                                        onChange={(event) => {
                                                            this.setState({
                                                                officerInfo: {
                                                                    ...this.state.officerInfo,
                                                                    professional: {
                                                                        ...this.state.officerInfo.professional,
                                                                        status: event.target.value
                                                                    }
                                                                }
                                                            });
                                                        }}
                                                        variant={"standard"}
                                                        disabled={!this.state.editMode}
                                                        slotProps={OfficerInfoSelectSlotProps}>
                                                    {statusOptions}
                                                </StyledSelect>
                                            </div>
                                            <Divider/>
                                            {/*Data de Entrada pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Data de Entrada:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled={!this.state.editMode}
                                                    type={"date"}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.professional.entry_date}
                                                    onChange={(event) => {
                                                       this.setState({
                                                           officerInfo: {
                                                               ...this.state.officerInfo,
                                                               professional: {
                                                                   ...this.state.officerInfo.professional,
                                                                   entry_date: event.target.value
                                                               }
                                                           }
                                                       });
                                                   }}
                                                />
                                            </div>
                                            <Divider/>
                                            {/*Data de Subida pair*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Data de Subida:</label>
                                                <StyledInput
                                                    variant={"standard"}
                                                    disabled
                                                    type={"date"}
                                                    className={style.officerInfoInput}
                                                    value={this.state.officerInfo.professional.promotion_date} />
                                            </div>
                                            <Divider/>
                                            {/*Unidades Especiais*/}
                                            <div>
                                                <label className={style.officerInfoDetailLabel}>Unidades
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
                    </div>
                </div>
            </div>
        )
    }
}

export default OfficerInfo;