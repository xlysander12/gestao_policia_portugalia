import {Component} from "react";
import style from "./officerlist.module.css";



class OfficerList extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div>
                {/*Barra de pesquisa*/}
                <div className={style.officerListSearchDiv}>
                    <input className={style.officerListSearchInput} id={"officerSearch"} type={"text"} placeholder={"Pesquisar por nome, callsign, NIF ou telemóvel"}/>
                    <button className={style.officerListSearchButton}>Pesquisar</button>
                </div>

            </div>
        );
    }
}

export default OfficerList;