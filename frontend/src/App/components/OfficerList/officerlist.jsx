import React, {Component} from "react";
import style from "./officerlist.module.css";
import Loader from "../Loader/loader";


class OfficerCard extends Component {
    constructor(props) {
        super(props);

        this.handleDivClick = this.handleDivClick.bind(this);
    }

    handleDivClick() {
        if (this.props.disabled)
            return;

        this.props.clickFunction(this.props.nif);
    }

    render() {
        function statusToColor(status) {
            switch (status) {
                case "Ativo":
                    return ["#00fd00", "#000000"];
                case "Inativo":
                    return ["#fd0000", "#FFFFFF"];
                case "Suspenso":
                    return ["#fd0000", "#FFFFFF"];
                case "Provisório":
                    return ["#efc032", "#000000"];
                default:
                    return ["#000000", "#FFFFFF"];
            }
        }

        const [statusDivColor, statusTextColor] = statusToColor(this.props.status);

        return(
            <div className={this.props.disabled ? style.officerListCardDivDisabled : style.officerListCardDiv} onClick={this.handleDivClick} id={"officer" + this.props["nif"]}>
                <div style={{maxWidth: "70%"}}>
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
            officers: [],
            loading: false
        }

        this.search = this.search.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }



    async componentDidMount() {
        await this.search();
    }

    async search(query) {
        // Set the loading state to true
        this.setState({loading: true});

         // if query is undefined, then the user didn't search for anything
        if (query === undefined) query = "";

        // Send the request to the API to get the results from the search
        const response = await fetch("/portugalia/gestao_policia/api/officerInfo?search=" + query, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-PortalSeguranca-Force": localStorage.getItem("force")
            }
        });

        // If the response status is not 200, then there was an error
        if (response.status !== 200) {
            const response_json = await response.json();
            console.log(response_json["message"]);
            return;
        }

        // Get the response as JSON
        let responseJSON = await response.json();
        responseJSON = responseJSON.data; // Only need the actual data. In this case is a list with all the results

        // Update the state with the new officers
        this.setState({officers: responseJSON});

        // Set the loading state to false
        this.setState({loading: false});
    }

    async handleSearch(event) {
        event.preventDefault();

        await this.search(event.target.search.value);
    }

    handleClick(nif) {
        this.props["callbackFunction"](nif);
    }

    render() {

        // Build the officers' cards
        let officersCards = [];

        for (let i = 0; i < this.state.officers.length; i++) {
            officersCards.push(<OfficerCard key={"officer" + this.state.officers[i]["nif"]} name={`[${this.state.officers[i]["callsign"]}] ${this.state.officers[i]["patente"]} ${this.state.officers[i]["nome"]}`} nif={this.state.officers[i]["nif"]} status={this.state.officers[i]["status"]} clickFunction={this.handleClick} disabled={this.props.disabled}/>);
        }

        return(
            <div className={style.officerListMainDiv}>
                {/*Barra de pesquisa*/}
                <form onSubmit={this.handleSearch}>
                    <div className={style.officerListSearchDiv}>
                        <input className={style.officerListSearchInput} id={"officerSearch"} type={"text"}
                               placeholder={"Nome, patente, callsign, NIF, telemóvel ou discord ID"} name={"search"} disabled={this.props.disabled}/>
                        <input type={"submit"} className={style.officerListSearchButton} value={"Pesquisar"} disabled={this.props.disabled}/>
                    </div>
                </form>

                {/*Loader para lista de efetivos*/}
                <div className={style.officerListListDiv} style={this.state.loading ? {alignItems: "center", justifyContent: "center"}: {display: "none"}}>
                    <Loader/>
                </div>

                {/*Lista de efetivos*/}
                <div className={style.officerListListDiv} style={this.state.loading ? {display: "none"}: {}} hidden={this.state.loading}>
                    {officersCards}
                </div>
            </div>
        );
    }
}

export default OfficerList;