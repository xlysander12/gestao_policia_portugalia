import {Component} from "react";
import style from "./officerlist.module.css";


class OfficerCard extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        function statusToColor(status) {
            switch (status) {
                case "Ativo":
                    return ["#00fd00", "#000000"];
                case "Inativo":
                    return ["#fd0000", "#FFFFFF"];
                case "Provisório":
                    return ["#efc032", "#000000"];
            }

            return ["#000000", "#FFFFFF"];
        }

        const [statusDivColor, statusTextColor] = statusToColor(this.props.status);


        return(
            <div className={style.officerListCardDiv}>
                <div>
                    <p className={style.officerListCardName}>{this.props.name}</p>
                    <p className={style.officerListCardNif}>(#{this.props.nif})</p>
                </div>

                <div className={style.officerListCardStatus} style={{backgroundColor: statusDivColor}}>
                    <p className={style.officerListCardStatusText} style={{color: statusTextColor}}>{this.props.status}</p>
                </div>
            </div>
        );
    }

}


class OfficerList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            officers: []
        }

        this.search = this.search.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
    }



    async componentDidMount() {
        await this.search();
    }

    async search(query) {
         // if query is undefined, then the user didn't search for anything
        if (query === undefined) query = "";

        // Send the request to the API to get the results from the search
        const response = await fetch("/portugalia/gestao_policia/api/officerInfo?search=" + query, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            }
        });

        // If the response status is not 200, then there was an error
        if (response.status !== 200) {
            alert("Ocorreu um erro ao pesquisar. Por favor, tente novamente.");
            return;
        }

        // Get the response as JSON
        let responseJSON = await response.json();
        responseJSON = responseJSON.data; // Only need the actual data. In this case is a list with all the results

        // Update the state with the new officers
        this.setState({officers: responseJSON});
    }

    async handleSearch(event) {
        event.preventDefault();

        await this.search(event.target.search.value);
    }

    render() {

        // Build the officers' cards
        let officersCards = [];

        for (let i = 0; i < this.state.officers.length; i++) {
            officersCards.push(<OfficerCard key={this.state.officers[i]["nif"]} name={`${this.state.officers[i]["callsign"]} ${this.state.officers[i]["patente"]} ${this.state.officers[i]["nome"]}`} nif={this.state.officers[i]["nif"]} status={this.state.officers[i]["status"]}/>);
        }

        return(
            <div>
                {/*Barra de pesquisa*/}
                <form onSubmit={this.handleSearch}>
                    <div className={style.officerListSearchDiv}>
                        <input className={style.officerListSearchInput} id={"officerSearch"} type={"text"}
                               placeholder={"Pesquisar por nome, patente, callsign, NIF, telemóvel ou discord ID"} name={"search"}/>
                        <input type={"submit"} className={style.officerListSearchButton} value={"Pesquisar"}/>
                    </div>
                </form>


                {/*Lista de efetivos*/}
                <div className={style.officerListListDiv}>
                    {officersCards}
                </div>
            </div>
        );
    }
}

export default OfficerList;