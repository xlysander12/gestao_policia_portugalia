import React, {Component} from "react";
import style from "./officerinfo.module.css";
import Navbar from "../../components/Navbar/navbar";
import OfficerList from "../../components/OfficerList/officerlist";


class OfficerInfo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            officerNif: "",

            nome: "",
            telemovel: "",
            iban:"",
            kms: "",
            discord: ""
        }

        this.officerListCallback = this.officerListCallback.bind(this);
    }

    officerListCallback(nif) {
        this.setState({
            officerNif: nif
        })
    }

    render(){
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
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonCreate].join(" ")}>Adicionar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonEdit].join(" ")}>Editar</button>
                                <button className={[style.officerInfoAlterButton, style.officerInfoAlterButtonDelete].join(" ")}>Apagar</button>
                            </div>

                            <div className={style.officerInfoDetailsDiv}>
                                <fieldset>
                                    <legend>Informação Pessoal</legend>

                                    <p>Nome: <span>{this.state.nome ? this.state.nome : "N/A"}</span></p>
                                    <p>NIF: <span>{this.state.officerNif ? this.state.officerNif : "N/A"}</span></p>
                                    <p>Telemóvel: <span>{this.state.telemovel ? this.state.telemovel : "N/A"}</span></p>
                                    <p>IBAN: <span>{this.state.iban ? this.state.iban : "N/A"}</span></p>
                                    <p>KMs: <span>{this.state.kms ? this.state.kms : "N/A"}</span></p>
                                    <p>Discord ID: <span>{this.state.discord ? this.state.discord : "N/A"}</span></p>
                                </fieldset>

                                <fieldset>
                                    <legend>Informação na Força</legend>

                                    <p>Patente: <span>{this.state.patente}</span></p>
                                </fieldset>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default OfficerInfo;