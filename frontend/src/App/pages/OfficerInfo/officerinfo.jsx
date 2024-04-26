import React, {Component} from "react";
import style from "./officerinfo.module.css";
import Navbar from "../../components/Navbar/navbar";
import OfficerList from "../../components/OfficerList/officerlist";
import Loader from "../../components/Loader/loader";


class OfficerInfo extends Component {
    constructor(props) {
        super(props);

        this.editIntents = false;
        this.loggedPatent = undefined;

        this.officerInfo = {
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
                status: undefined
            },
            special_units: []
        }

        this.patents = [];
        this.statuses = [];
        this.specialUnits = [];
        this.unitsRoles = [];

        this.state = {
            loading: true,
            editMode: false,
            hasEditPermissions: false,
        }

        this.officerListCallback = this.officerListCallback.bind(this);
        this.fillInputs = this.fillInputs.bind(this);
        this.enableEditMode = this.enableEditMode.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.doesUserBelongToUnit = this.doesUserBelongToUnit.bind(this);
        this.getUnitNameFromId = this.getUnitNameFromId.bind(this);
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

        // Format the dates to match the requirements of the input type date
        data.data_entrada = data.data_entrada.split("T")[0];
        data.data_subida = data.data_subida.split("T")[0];

        // Apply the data to the officerInfo object
        // // Personal Data
        this.officerInfo.personal = {
            nome: data.nome,
            nif: data.nif,
            telemovel: data.telemovel,
            iban: data.iban,
            kms: data.kms,
            discord: data.discord,
            steam: data.steam
        }

        // // Professional Data
        this.officerInfo.professional = {
            patente: data.patente,
            callsign: data.callsign,
            data_entrada: data.data_entrada,
            data_subida: data.data_subida,
            status: data.status
        }

        // Add the units to the info object
        console.log(data.unidades);
        this.officerInfo.special_units = data.unidades;

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
        for (let unit of this.officerInfo.special_units) {
            if (unit.id === unit_id) {
                return true;
            }
        }
        return false;
    }

    fillInputs(category, key) {
        return this.officerInfo[category][key] ? this.officerInfo[category][key] : "N/A";
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

    handleInputChange(event) {
        // Check if key exists
        if (this.officerInfo.personal[event.target.name])
            this.officerInfo.personal[event.target.name] = event.target.value;
        else if (this.officerInfo.professional[event.target.name])
            this.officerInfo.professional[event.target.name] = event.target.value;

        this.forceUpdate();
    }

    render() {
        // Before rendering the page, we need to build the patentes and status options
        const patentesOptions = this.patents.map((patente) => {
            return <option key={`patent${patente.num}`} value={patente.num} disabled={patente.num > this.loggedPatent}>{patente.nome}</option>
        });

        const statusOptions = this.statuses.map((status) => {
           return <option key={`status${status.num}`} value={status.num}>{status.nome}</option>
        });

        const specialUnitsOptions = this.specialUnits.map((unit) => {
           if (!this.doesUserBelongToUnit(unit.id))
               return <option key={`unit${unit.id}`} value={unit.id}>{unit.nome}</option>
        });

        const specialUnitsRolesOptions = this.unitsRoles.map((role) => {
            return <option key={`role${role.id}`} value={role.id}>{role.cargo}</option>
        });

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
                                <button type={"submit"} form={"information-form"} className={[style.officerInfoAlterButton, style.officerInfoAlterButtonSave].join(" ")} hidden={!this.state.editMode}>Guardar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonCreate].join(" ")} hidden={this.state.editMode || !this.editIntents}>Recrutar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonEdit].join(" ")} hidden={this.state.editMode || !this.state.hasEditPermissions} onClick={this.enableEditMode}>Editar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonDelete].join(" ")} hidden={this.state.editMode || !this.state.hasEditPermissions}>Despedir</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonImport].join(" ")} style={{float: "left"}} hidden={this.state.editMode || !this.editIntents}>Importar do HUB</button>
                            </div>

                            <form id={"information-form"}>
                                {/*Loader Div*/}
                                <div className={style.officerInfoDetailsDiv} style={{justifyContent: "center", alignItems: "center", display: `${this.state.loading ? "flex": "none"}`}}>
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
                                                   value={this.fillInputs("personal", "nome")} onChange={(e) => {
                                                         this.officerInfo.personal.nome = e.target.value;
                                                         this.forceUpdate();
                                            }}/>

                                            {/*NIF pair*/}
                                            <label className={style.officerInfoDetailLabel}>NIF:</label>
                                            <input name={"nif"} className={style.officerInfoInput} type={"text"}
                                                   value={this.fillInputs("personal", "nif")} disabled={true}/>

                                            {/*Cellphone pair*/}
                                            <label className={style.officerInfoDetailLabel}>Telemóvel:</label>
                                            <input name={"telemovel"} pattern={"^[0-9]{9}$"} className={style.officerInfoInput}
                                                   value={this.fillInputs("personal", "telemovel")} onChange={(event) => {
                                                     this.officerInfo.personal.telemovel = event.target.value;
                                                     this.forceUpdate();
                                            }}/>

                                            {/*IBAN pair*/}
                                            <label className={style.officerInfoDetailLabel}>IBAN:</label>
                                            <input name={"iban"} pattern={"^PT[0-9]{5,8}$"} className={style.officerInfoInput}
                                                   value={this.fillInputs("personal", "iban")} onChange={this.handleInputChange}/>

                                            {/*KMs pair*/}
                                            <label className={style.officerInfoDetailLabel}>KMs:</label>
                                            <input name={"kms"} className={style.officerInfoInput}
                                                   value={this.fillInputs("personal", "kms")} onChange={this.handleInputChange}/>

                                            {/*Discord pair*/}
                                            <label className={style.officerInfoDetailLabel}>Discord ID:</label>
                                            <input name={"discord"} className={style.officerInfoInput}
                                                   value={this.fillInputs("personal", "discord")} onChange={this.handleInputChange}/>

                                            {/*Steam pair*/}
                                            <label className={style.officerInfoDetailLabel}>Steam ID:</label>
                                            <input name={"steam"} className={style.officerInfoInput}
                                                   value={this.fillInputs("personal", "steam")} onChange={this.handleInputChange}/>
                                        </div>
                                    </fieldset>

                                    <fieldset disabled={!this.state.editMode}>
                                        <legend>Informação Profissional</legend>

                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Patente pair*/}
                                            <label className={style.officerInfoDetailLabel}>Patente:</label>
                                            <select className={style.officerInfoInput} value={this.fillInputs("professional", "patente")} onChange={this.handleInputChange}>
                                                <option value={"-2"} disabled={true}>N/A</option>
                                                {patentesOptions}
                                            </select>

                                            {/*CallSign pair*/}
                                            <label className={style.officerInfoDetailLabel}>CallSign:</label>
                                            <input className={style.officerInfoInput}
                                                   value={this.fillInputs("professional", "callsign")} onChange={this.handleInputChange}/>

                                            {/*Status pair*/}
                                            <label className={style.officerInfoDetailLabel}>Status:</label>
                                            <select className={style.officerInfoInput}
                                                    value={this.fillInputs("professional", "status")} onChange={this.handleInputChange}>
                                                <option value={"-2"} disabled={true}>N/A</option>
                                                {statusOptions}
                                            </select>

                                            {/*Data de Entrada pair*/}
                                            <label className={style.officerInfoDetailLabel}>Data de Entrada:</label>
                                            <input type={"date"} className={style.officerInfoInput}
                                                   value={this.fillInputs("professional", "data_entrada")} onChange={this.handleInputChange}/>

                                            {/*Data de Subida pair*/}
                                            <label className={style.officerInfoDetailLabel}>Data de Subida:</label>
                                            <input type={"date"} className={style.officerInfoInput}
                                                   value={this.fillInputs("professional", "data_subida")} onChange={this.handleInputChange}/>

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
                                                    {this.officerInfo.special_units.map((unit) => {
                                                        console.log(unit);
                                                        return <tr key={`unit${unit.id}`}>
                                                            <td style={{fontSize: "0.8rem"}}>{this.getUnitNameFromId(unit.id)}</td>
                                                            <td><select className={style.officerInfoUnitsSelect} value={unit.cargo}>
                                                                {specialUnitsRolesOptions}
                                                            </select></td>
                                                            <td hidden={!this.state.editMode}><button type={"button"}>Remover</button></td>
                                                        </tr>
                                                    })}
                                                </tbody>
                                                <tfoot hidden={!this.state.editMode}> {/*Only show the add button if the edit mode is enabled*/}
                                                    <tr>
                                                        <td><select>
                                                            {specialUnitsOptions}
                                                        </select></td>
                                                        <td><select>
                                                            {specialUnitsRolesOptions}
                                                        </select></td>
                                                        <td><button type={"button"}>Adicionar</button></td>
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