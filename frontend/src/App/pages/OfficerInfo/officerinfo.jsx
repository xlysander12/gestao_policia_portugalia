import React, {Component} from "react";
import style from "./officerinfo.module.css";
import Navbar from "../../components/Navbar/navbar";
import OfficerList from "../../components/OfficerList/officerlist";


class OfficerInfo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            choosen: false,
            editMode: false,

            nome: "",
            nif: "",
            telemovel: "",
            iban:"",
            kms: "",
            discord: "",
            steam: "",


            patente: "",
            callsign: "",
            data_entrada: "",
            data_subida: "",
            status: "",

            patentes: [],
            statuses: []
        }

        this.officerListCallback = this.officerListCallback.bind(this);
        this.fillInputs = this.fillInputs.bind(this);
        this.enableEditMode = this.enableEditMode.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    async fetchOfficerInfo() {
        const response = await fetch(`portugalia/gestao_policia/api/officerInfo/${this.state.nif}?raw`, {
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
            console.error(responseJson.message);
            return false;
        }

        // Fetch the actual data from the response
        const data = responseJson.data;

        // Format the dates to match the requirements of the input type date
        data.data_entrada = data.data_entrada.split("T")[0];
        data.data_subida = data.data_subida.split("T")[0];

        // Update the state with the new data
        this.setState(data);

        return true;
    }

    async componentDidMount() {
        // When the page loads, we need to fetch the available patentes and status
        const patentsResponse = await fetch("portugalia/gestao_policia/api/util/patents", {
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

        const patentsJson = (await patentsResponse.json()).data;

        const statusResponse = await fetch("portugalia/gestao_policia/api/util/statuses", {
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

        const statusJson = (await statusResponse.json()).data;

        // After fetching the data, apply it to the state
        this.setState({
            patentes: patentsJson,
            statuses: statusJson
        });


        // TODO: If the nif is present in the URL, then we can fetch the officer info

    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        // Only update if nif has changed
        if (prevState.nif === this.state.nif) {
            return;
        }


        // Since we now the nif has changed, we can fetch the new officer info and apply it to the state
        const result = await this.fetchOfficerInfo();

        if (!result) return;

        // After applying everything, we can set the choosen state to true if it isn't already
        if (!this.state.choosen) {
            this.setState({
                choosen: true
            });
        }
    }

    fillInputs(key) {
        return this.state[key] ? this.state[key] : "N/A";
    }

    officerListCallback(nif) {
        this.setState({
            editMode: false,
            nif: nif
        });
    }

    enableEditMode() {
        this.setState({
            editMode: true
        });
    }

    handleInputChange(event) {
        console.log(event.target.name);
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    render() {
        // Before rendering the page, we need to build the patentes and status options
        const patentesOptions = this.state.patentes.map((patente) => {
            return <option value={patente.num}>{patente.nome}</option>
        });

        const statusOptions = this.state.statuses.map((status) => {
           return <option value={status.num}>{status.nome}</option>
        });

        return(
            <div>
                <Navbar path={[["Efetivos", ""]]}/>
                <div style={{display: "flex"}}>
                    <div className={style.officerListDiv}>
                        <OfficerList callbackFunction={this.officerListCallback}/>
                    </div>

                    <div className={style.officerInfoOuterDiv}>
                        <div className={style.officerInfoInnerDiv}>
                            <div className={style.officerInfoAlterbarDiv}>
                                <button type={"submit"} form={"information-form"} className={[style.officerInfoAlterButton, style.officerInfoAlterButtonSave].join(" ")} hidden={!this.state.editMode}>Guardar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonCreate].join(" ")} hidden={this.state.editMode}>Recrutar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonEdit].join(" ")} hidden={this.state.editMode} onClick={this.enableEditMode}>Editar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonDelete].join(" ")} hidden={this.state.editMode}>Despedir</button>
                            </div>

                            <form id={"information-form"}>
                                <div className={style.officerInfoDetailsDiv}>
                                    <fieldset disabled={!this.state.choosen}>
                                        <legend>Informação Pessoal</legend>

                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Name pair*/}
                                            <label className={style.officerInfoDetailLabel}>Nome:</label>
                                            <input name="nome" className={style.officerInfoInput} type={"text"}
                                                   disabled={!this.state.editMode}
                                                   value={this.fillInputs("nome")} onChange={this.handleInputChange}/>

                                            {/*NIF pair*/}
                                            <label className={style.officerInfoDetailLabel}>NIF:</label>
                                            <input className={style.officerInfoInput} type={"text"}
                                                   disabled={!this.state.editMode}
                                                   value={this.fillInputs("nif")} onChange={(e) => {this.handleInputChange(e, "nif")}}/>

                                            {/*Cellphone pair*/}
                                            <label className={style.officerInfoDetailLabel}>Telemóvel:</label>
                                            <input pattern={"^[0-9]{9}$"} className={style.officerInfoInput}
                                                   disabled={!this.state.editMode}
                                                   value={this.fillInputs("telemovel")} onChange={this.handleInputChange}/>

                                            {/*IBAN pair*/}
                                            <label className={style.officerInfoDetailLabel}>IBAN:</label>
                                            <input pattern={"^PT[0-9]{5,8}$"} className={style.officerInfoInput}
                                                   disabled={!this.state.editMode}
                                                   value={this.fillInputs("iban")} onChange={() => {}}/>

                                            {/*KMs pair*/}
                                            <label className={style.officerInfoDetailLabel}>KMs:</label>
                                            <input className={style.officerInfoInput} disabled={!this.state.editMode}
                                                   value={this.fillInputs("kms")} onChange={() => {}}/>

                                            {/*Discord pair*/}
                                            <label className={style.officerInfoDetailLabel}>Discord ID:</label>
                                            <input className={style.officerInfoInput} disabled={!this.state.editMode}
                                                   value={this.fillInputs("discord")} onChange={() => {}}/>

                                            {/*Steam pair*/}
                                            <label className={style.officerInfoDetailLabel}>Steam ID:</label>
                                            <input className={style.officerInfoInput} disabled={!this.state.editMode}
                                                   value={this.fillInputs("steam")} onChange={() => {}}/>
                                        </div>
                                    </fieldset>

                                    <fieldset disabled={!this.state.choosen}>
                                        <legend>Informação Profissional</legend>

                                        <div className={style.officerInfoInnerFieldsetDiv}>
                                            {/*Patente pair*/}
                                            <label className={style.officerInfoDetailLabel}>Patente:</label>
                                            <select className={style.officerInfoInput} disabled={!this.state.editMode} value={this.state.patente}>
                                                <option value={"-2"} disabled={true}>N/A</option>
                                                {patentesOptions}
                                            </select>

                                            {/*CallSign pair*/}
                                            <label className={style.officerInfoDetailLabel}>CallSign:</label>
                                            <input className={style.officerInfoInput} disabled={!this.state.editMode}
                                                   value={this.fillInputs("callsign")} onChange={() => {
                                            }}/>

                                            {/*Status pair*/}
                                            <label className={style.officerInfoDetailLabel}>Status:</label>
                                            <select className={style.officerInfoInput} disabled={!this.state.editMode}
                                                    value={this.state.status}>
                                                <option value={"-2"} disabled={true}>N/A</option>
                                                {statusOptions}
                                            </select>

                                            {/*Data de Entrada pair*/}
                                            <label className={style.officerInfoDetailLabel}>Data de Entrada:</label>
                                            <input type={"date"} className={style.officerInfoInput} disabled={!this.state.editMode}
                                                   value={this.fillInputs("data_entrada")} onChange={() => {
                                            }}/>

                                            {/*Data de Subida pair*/}
                                            <label className={style.officerInfoDetailLabel}>Data de Subida:</label>
                                            <input type={"date"} className={style.officerInfoInput} disabled={!this.state.editMode}
                                                   value={this.fillInputs("data_subida")} onChange={() => {
                                            }}/>
                                        </div>
                                    </fieldset>

                                    <fieldset disabled={!this.state.choosen}>
                                        <legend>Atividade</legend>

                                        <p>Justificação ativa: <span></span>
                                        </p>
                                        <p>Última picagem: <span></span>
                                        </p>
                                        <p>Última
                                            semana: <span>{"N/A"}</span>
                                        </p>
                                    </fieldset>
                                    <fieldset disabled={!this.state.choosen}>
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