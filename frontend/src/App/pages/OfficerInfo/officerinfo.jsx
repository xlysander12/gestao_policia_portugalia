import React, {Component} from "react";
import style from "./officerinfo.module.css";
import modalsStyle from "./officerinfomodals.module.css";
import Navbar from "../../components/Navbar/navbar";
import OfficerList from "../../components/OfficerList/officerlist";
import Loader from "../../components/Loader/loader";
import Popup from "reactjs-popup";

class RecruitModal extends Component {
    constructor(props) {
        super(props);

        // Check if a trigger is present
        if (!props.trigger) {
            console.error("No trigger was passed to the RecruitModal component");
            return;
        }

        this.info = {
            nome: undefined,
            nif: undefined,
            telemovel: undefined,
            iban: undefined,
            kms: undefined,
            discord: undefined,
            steam: undefined,

            cadete: false
        }

        this.recruitMember = this.recruitMember.bind(this);
    }

    async recruitMember(event) {
        event.preventDefault();

        // Make the request to recruit the new member
        const recruitRequest = await fetch(`/portugalia/gestao_policia/api/officerInfo/${this.info.nif}${this.info.cadete ? "?recruit": ""}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-Portalseguranca-Force": localStorage.getItem("force")
            },
            body: JSON.stringify(this.info)
        });

        // Check if the response is ok
        if (!recruitRequest.ok) {
            alert((await recruitRequest.json()).message);
            return;
        }

        // After recruiting the new member, we can reload the page using the officer's nif as a query param
        window.location = `/portugalia/gestao_policia/efetivos?nif=${this.info.nif}`;
    }

    render () {
        return (
            <Popup trigger={this.props.trigger} modal>
                <div className={modalsStyle.modal}>
                    <div className={modalsStyle.header}>Recrutar novo efetivo</div>
                    <div className={modalsStyle.content}>
                        <form onSubmit={this.recruitMember}>
                            <div className={modalsStyle.formDiv}>
                                {/* TODO: add proper titles to explain the custom patterns */}
                                <label htmlFor={"recruitname"}>Nome:</label>
                                <input id={"recruitname"} name={"nome"} type={"text"} onChange={(event) => {this.info.nome = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitnif"}>NIF:</label>
                                <input id={"recruitnif"} name={"nif"} type={"text"} pattern={"^[0-9]{9}$"} onChange={(event) => {this.info.nif = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitphone"}>Telemóvel:</label>
                                <input id={"recuitphone"} name={"telemovel"} type={"text"} pattern={"^[0-9]{9}$"} onChange={(event) => {this.info.telemovel = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitiban"}>IBAN:</label>
                                <input id={"recruitiban"} name={"iban"} type={"text"} pattern={"^PT[0-9]{5,8}$"} onChange={(event) => {this.info.iban = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitkms"}>KMs:</label>
                                <input id={"recruitkms"} name={"kms"} type={"number"} step={100} onChange={(event) => {this.info.kms = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitdiscord"}>Discord ID:</label>
                                <input id={"recruitdiscord"} name={"discord"} type={"text"} pattern={"[0-9]+"} onChange={(event) => {this.info.discord = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label htmlFor={"recruitsteam"}>Steam ID:</label>
                                <input id={"recruitsteam"} name={"steam"} type={"text"} pattern={"steam:.+"} onChange={(event) => {this.info.steam = event.target.value; event.target.className = ""}} onInvalid={(event) => {event.target.className += modalsStyle.invalidInput}} required/>

                                <label>Recrutar como Cadete:
                                    <input className={modalsStyle.cadetCheckBox} id={"recruitcadet"} name={"cadete"} type={"checkbox"}
                                                                   onChange={(event) => {
                                                                       this.info.cadete = event.target.value
                                                                   }}/>
                                </label>


                                <button className={modalsStyle.submitButton} type={"submit"}>Recrutar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </Popup>
        );
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
                    nome: undefined,
                    nif: undefined,
                    telemovel: undefined,
                    iban: undefined,
                    kms: undefined,
                    discord: undefined,
                    steam: undefined,
                },
                professional: {
                    patente: undefined,
                    callsign: undefined,
                    data_entrada: undefined,
                    data_subida: undefined,
                    status: undefined,
                    special_units: []
                }
            }
        }

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

        const response = await fetch(`/portugalia/gestao_policia/api/officerInfo/${nif}?raw`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-Portalseguranca-Force": localStorage.getItem("force")
            }
        });

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
                   nome: data.nome,
                   nif: data.nif,
                   telemovel: data.telemovel,
                   iban: data.iban,
                   kms: data.kms,
                   discord: data.discord,
                   steam: data.steam
               },
               professional: {
                   patente: data.patente,
                   callsign: data.callsign,
                   // TODO: Dates in the frontend always appear 1 day behind
                   data_entrada: data.data_entrada,
                   data_subida: data.data_subida,
                   status: data.status,
                   special_units: data.unidades
               },
           }
        });
        // If the logged user has edit permissions, check if it's lower than the officer's patente
        if (this.editIntents) {
            this.setState({
                hasEditPermissions: this.loggedPatent > data.patente
            });
        }

        // After fetching the data, we can set the loading state to false
        this.setState({
            loading: false
        });
    }

    async updateOfficerInfo(event) {
        // Prevent the form from submitting
        event.preventDefault();

        // Check if every field has valid data
        let formIsValid = true;
        console.log(event.target);
        for (let element of event.target.elements) {
            if (!element.checkValidity()) {
                element.title = "Este campo está inválido"
                formIsValid = false;
            }
        }

        if (!formIsValid) return;


        // Then, we need to set the loading state to true if not already
        if (!this.state.loading)
            this.setState({
                loading: true
            });

        // Make the request to update the officer's info
        const updateRequest = await fetch(`/portugalia/gestao_policia/api/officerInfo/${this.state.officerInfo.personal.nif}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-Portalseguranca-Force": localStorage.getItem("force")
            },
            body: JSON.stringify({
                // Personal Info
                nome: this.state.officerInfo.personal.nome,
                telemovel: this.state.officerInfo.personal.telemovel,
                iban: this.state.officerInfo.personal.iban,
                kms: this.state.officerInfo.personal.kms,
                discord: this.state.officerInfo.personal.discord,
                steam: this.state.officerInfo.personal.steam,

                // Professional Info
                patente: this.state.officerInfo.professional.patente,
                callsign: this.state.officerInfo.professional.callsign,
                status: this.state.officerInfo.professional.status,
                data_entrada: this.state.officerInfo.professional.data_entrada,
                data_subida: this.state.officerInfo.professional.data_subida,

                // Special Units
                unidades: this.state.officerInfo.professional.special_units
            })
        });

        // Check if the response is ok
        if (!updateRequest.ok) {
            alert((await updateRequest.json()).message);
            return;
        }

        // After updating the data, we can reload the page using the officer's nif as a query param
        window.location = `/portugalia/gestao_policia/efetivos?nif=${this.state.officerInfo.personal.nif}`;
    }

    async componentDidMount() {
        // First, we need to check if the user has edit permissions
        const editIntentsResponse = await fetch("/portugalia/gestao_policia/api/validateToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-Portalseguranca-Force": localStorage.getItem("force")
            },
            body: JSON.stringify({
                "intent": "officer"
            })
        });

        // Sinc the response is OK, we can set the editIntents to true and fetch the officers patent
        if (editIntentsResponse.ok) {
            this.editIntents = true;
            const loggedNif = (await editIntentsResponse.json()).data

            // Get the logged officers's patent as an int
            const loggedOfficerResponse = await fetch(`/portugalia/gestao_policia/api/officerInfo/${loggedNif}?raw`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("token"),
                    "X-Portalseguranca-Force": localStorage.getItem("force")
                }
            });

            if (!loggedOfficerResponse.ok) {
                return;
            }

            this.loggedPatent = (await loggedOfficerResponse.json()).data.patente;
        }


        // When the page loads, we need to fetch the available patents and statuses
        const patentsResponse = await fetch("/portugalia/gestao_policia/api/util/patents", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Portalseguranca-Force": localStorage.getItem("force")
            }
        });

        // Mandatory check if the status code was 200
        if (!patentsResponse.ok) {
            return;
        }

        // Apply the data to the class object
        this.patents = (await patentsResponse.json()).data;

        const statusResponse = await fetch("/portugalia/gestao_policia/api/util/statuses", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Portalseguranca-Force": localStorage.getItem("force")
            }
        });

        // Mandatory check if the status code was 200
        if (!statusResponse.ok) {
            return;
        }

        // Apply the data to the class object
        this.statuses = (await statusResponse.json()).data;

        const specialUnitsResponse = await fetch("/portugalia/gestao_policia/api/util/specialunits", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Portalseguranca-Force": localStorage.getItem("force")
            }
        });

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
        }
    }

    getUnitNameFromId(unitId) {
        for (let unit of this.specialUnits) {
            if (unit.id === unitId) {
                return unit.nome;
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
        const patentesOptions = this.patents.map((patente) => {
            return <option key={`patent${patente.id}`} value={patente.id} disabled={patente.id > this.loggedPatent}>{patente.nome}</option>
        });

        const statusOptions = this.statuses.map((status) => {
           return <option key={`status${status.id}`} value={status.id}>{status.nome}</option>
        });

        const specialUnitsOptions = this.specialUnits.map((unit) => {
           if (!this.doesUserBelongToUnit(unit.id))
               return <option key={`unit${unit.id}`} value={unit.id}>{unit.nome}</option>
        });

        const specialUnitsRolesOptions = this.unitsRoles.map((role) => {
            return <option key={`role${role.id}`} value={role.id}>{role.cargo}</option>
        });

        // Build the Recruit Button
        let recruitButton = (<button
            className={[style.officerInfoAlterButton, style.officerInfoAlterButtonCreate].join(" ")}
            hidden={this.state.editMode || !this.editIntents}>Recrutar</button>);


        return(
            <div>
                {/*Navbar*/}
                <Navbar path={[["Efetivos", ""]]}/>

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

                                <RecruitModal trigger={recruitButton}></RecruitModal>

                                <button
                                    className={[style.officerInfoAlterButton, style.officerInfoAlterButtonEdit].join(" ")}
                                    hidden={this.state.editMode || !this.state.hasEditPermissions}
                                    onClick={this.enableEditMode}>Editar
                                </button>
                                <button
                                    className={[style.officerInfoAlterButton, style.officerInfoAlterButtonDelete].join(" ")}
                                    hidden={this.state.editMode || !this.state.hasEditPermissions}>Despedir
                                </button>
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

                            <form id={"information-form"} onSubmit={this.updateOfficerInfo}>
                                {/*Loader Div*/}
                                <div className={style.officerInfoDetailsDiv} style={{
                                    justifyContent: "center",
                                    alignItems: "center", display: `${this.state.loading ? "flex": "none"}`}}>
                                    <Loader color={"#3498db"}/>
                                </div>

                                {/*Information div*/}
                                <div className={style.officerInfoDetailsDiv} style={this.state.loading ? {display: "none"}: {}}>
                                    <fieldset disabled={!this.state.editMode}>
                                        <legend>Informação Pessoal</legend>

                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Name pair*/}
                                            <label className={style.officerInfoDetailLabel}>Nome:</label>
                                            <input name="nome" className={style.officerInfoInput} type={"text"}
                                                   value={this.state.officerInfo.personal.nome} onChange={(event) => {
                                                       this.setState({
                                                          officerInfo: {
                                                              ...this.state.officerInfo,
                                                                personal: {
                                                                    ...this.state.officerInfo.personal,
                                                                    nome: event.target.value
                                                                }
                                                          }
                                                       });
                                            }}/>

                                            {/*NIF pair*/}
                                            <label className={style.officerInfoDetailLabel}>NIF:</label>
                                            <input name={"nif"} className={style.officerInfoInput} type={"text"}
                                                   value={this.state.officerInfo.personal.nif} readOnly={true}/>

                                            {/*Cellphone pair*/}
                                            <label className={style.officerInfoDetailLabel}>Telemóvel:</label>
                                            <input name={"telemovel"} pattern={"^[0-9]{9}$"} title={"O telemóvel é um número composto por 9 dígitos"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.personal.telemovel} onChange={(event) => {
                                                         this.setState({
                                                              officerInfo: {
                                                                  ...this.state.officerInfo,
                                                                  personal: {
                                                                      ...this.state.officerInfo.personal,
                                                                      telemovel: event.target.value
                                                                  }
                                                              }
                                                         });
                                            }}/>

                                            {/*IBAN pair*/}
                                            <label className={style.officerInfoDetailLabel}>IBAN:</label>
                                            <input name={"iban"} pattern={"^PT[0-9]{5,8}$"} title={"O IBAN é uma sequência de \"PT\" seguido de 5 a 9 dígitos"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.personal.iban} onChange={(event) => {
                                                            this.setState({
                                                                officerInfo: {
                                                                    ...this.state.officerInfo,
                                                                    personal: {
                                                                        ...this.state.officerInfo.personal,
                                                                        iban: event.target.value
                                                                    }
                                                                }
                                                            });
                                            }}/>

                                            {/*KMs pair*/}
                                            <label className={style.officerInfoDetailLabel}>KMs:</label>
                                            <input name={"kms"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.personal.kms} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        personal: {
                                                            ...this.state.officerInfo.personal,
                                                            kms: event.target.value
                                                        }
                                                    }
                                                });
                                            }}/>

                                            {/*Discord pair*/}
                                            <label className={style.officerInfoDetailLabel}>Discord ID:</label>
                                            <input name={"discord"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.personal.discord} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        personal: {
                                                            ...this.state.officerInfo.personal,
                                                            discord: event.target.value
                                                        }
                                                    }
                                                });
                                            }}/>

                                            {/*Steam pair*/}
                                            <label className={style.officerInfoDetailLabel}>Steam ID:</label>
                                            <input name={"steam"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.personal.steam} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        personal: {
                                                            ...this.state.officerInfo.personal,
                                                            iban: event.target.value
                                                        }
                                                    }
                                                });
                                            }}/>
                                        </div>
                                    </fieldset>

                                    <fieldset disabled={!this.state.editMode}>
                                        <legend>Informação Profissional</legend>

                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Patente pair*/}
                                            <label className={style.officerInfoDetailLabel}>Patente:</label>
                                            <select className={style.officerInfoInput} value={this.state.officerInfo.professional.patente} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        professional: {
                                                            ...this.state.officerInfo.professional,
                                                            patente: event.target.value
                                                        }
                                                    }
                                                });
                                            }}>
                                                <option value={"-2"} disabled={true}>N/A</option>
                                                {patentesOptions}
                                            </select>

                                            {/*CallSign pair*/}
                                            <label className={style.officerInfoDetailLabel}>CallSign:</label>
                                            <input className={style.officerInfoInput}
                                                   value={this.state.officerInfo.professional.callsign} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        professional: {
                                                            ...this.state.officerInfo.professional,
                                                            callsign: event.target.value
                                                        }
                                                    }
                                                });
                                            }}/>

                                            {/*Status pair*/}
                                            <label className={style.officerInfoDetailLabel}>Status:</label>
                                            <select className={style.officerInfoInput}
                                                    value={this.state.officerInfo.professional.status} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        professional: {
                                                            ...this.state.officerInfo.professional,
                                                            status: event.target.value
                                                        }
                                                    }
                                                });
                                            }}>
                                                <option value={"-2"} disabled={true}>N/A</option>
                                                {statusOptions}
                                            </select>

                                            {/*Data de Entrada pair*/}
                                            <label className={style.officerInfoDetailLabel}>Data de Entrada:</label>
                                            <input type={"date"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.professional.data_entrada} onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        professional: {
                                                            ...this.state.officerInfo.professional,
                                                            data_entrada: event.target.value
                                                        }
                                                    }
                                                });
                                            }}/>

                                            {/*Data de Subida pair*/}
                                            <label className={style.officerInfoDetailLabel}>Data de Subida:</label>
                                            <input type={"date"} className={style.officerInfoInput}
                                                   value={this.state.officerInfo.professional.data_subida}
                                                   onChange={(event) => {
                                                this.setState({
                                                    officerInfo: {
                                                        ...this.state.officerInfo,
                                                        professional: {
                                                            ...this.state.officerInfo.professional,
                                                            data_subida: event.target.value
                                                        }
                                                    }
                                                });
                                            }}/>

                                            {/*Unidades Especiais*/}
                                            <label className={style.officerInfoDetailLabel}>Unidades Especiais:</label>
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
                                                            <td><select className={style.officerInfoUnitsSelect} value={unit.cargo} onChange={(event) => {
                                                                // Update the unit's role
                                                                let current_units = this.state.officerInfo.professional.special_units;
                                                                const index = current_units.indexOf(unit);
                                                                current_units[index].cargo = parseInt(event.target.value);

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
                                                            <td hidden={!this.state.editMode}><button type={"button"} onClick={() => {
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
                                                            }}>Remover</button></td>
                                                        </tr>
                                                    })}
                                                </tbody>
                                                <tfoot hidden={!this.state.editMode}> {/*Only show the add button if the edit mode is enabled*/}
                                                    <tr>
                                                        <td><select id={"officerInfoNewUnitValue"}>
                                                            {specialUnitsOptions}
                                                        </select></td>
                                                        <td><select id={"officerInfoNewUnitRole"}>
                                                            {specialUnitsRolesOptions}
                                                        </select></td>
                                                        <td><button type={"button"} onClick={() => {
                                                            // Add the unit to the state
                                                            let current_units = this.state.officerInfo.professional.special_units;
                                                            console.log(JSON.stringify(current_units));
                                                            current_units.push({
                                                                id: parseInt(document.getElementById("officerInfoNewUnitValue").value),
                                                                cargo: parseInt(document.getElementById("officerInfoNewUnitRole").value)
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
                                                        }}>Adicionar</button></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </fieldset>

                                    <fieldset disabled={this.state.loading}>
                                        <legend>Atividade</legend>

                                        <p>Justificação ativa: <span></span>
                                        </p>
                                        <p>Última picagem: <span></span>
                                        </p>
                                        <p>Última
                                            semana: <span>{"N/A"}</span>
                                        </p>
                                    </fieldset>
                                    <fieldset disabled={this.state.loading}>
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