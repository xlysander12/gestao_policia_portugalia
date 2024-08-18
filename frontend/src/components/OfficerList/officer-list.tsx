import {ReactElement, useEffect, useState, ChangeEvent} from "react";
import style from "./officer-list.module.css";
import Loader from "../Loader/loader";
import {make_request} from "../../utils/requests";
import {DefaultButton, DefaultOutlinedTextField} from "../DefaultComponents/default-components.tsx";

type OfficerCardProps = {
    name: string,
    nif: string,
    status: string,
    callback: (nif: string) => void,
    disabled: boolean
}

function OfficerCard({name, nif, status, callback, disabled}: OfficerCardProps): ReactElement {
    const handleDivClick = () => {
        if (disabled)
            return;

        callback(nif);
    }

    const statusToColor = (status: string) => {
        switch (status) {
            case "Ativo":
                return ["#00fd00", "#000000"];
            case "Inativo":
                return ["#fd0000", "#FFFFFF"];
            case "Suspenso":
                return ["#fd0000", "#FFFFFF"];
            case "Provisório":
                return ["#efc032", "#000000"];
            case "Formação":
                return ["#9800fd", "#000000"];
            default:
                return ["#000000", "#FFFFFF"];
        }
    }

    const [statusDivColor] = statusToColor(status);

    return(
        <div className={disabled ? style.officerListCardDivDisabled : style.officerListCardDiv} style={{borderColor: `${statusDivColor}`}} onClick={handleDivClick}>
            <div>
                <p className={style.officerListCardName}>{name}</p>
                <p className={style.officerListCardNif}>(#{nif})</p>
            </div>

            {/*<div className={style.officerListCardStatus} style={{backgroundColor: statusDivColor}}>*/}
            {/*    <p className={style.officerListCardStatusText} style={{color: statusTextColor}}>{this.props.status}</p>*/}
            {/*</div>*/}
        </div>
    );

}


type OfficerListProps = {
    callbackFunction: (nif: string) => void,
    disabled?: boolean

}

function OfficerList({callbackFunction, disabled = false}: OfficerListProps) {
    // Initialize state
    const [officers, setOfficers] = useState([]);
    const [searchString, setSearchString] = useState("");
    const [loading, setLoading] = useState(false);

    // Function to fetch the backend and get the officers depending on the search query
    const search = async (query?: string) => {
        // Set the loading state to true
        setLoading(true);

        // Send the request to the API to get the results from the search
        const response = await make_request(`/officers${query ? `?search=${query}`: ""}`, "GET");

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
        setOfficers(responseJSON);

        // Set the loading state to false
        setLoading(false);
    }

    // On component mount, do an initial search with an empty string
    useEffect(() => {
        const initialSearch = async () => {
            await search();
        }

        initialSearch();
    }, []);


    // When the search button is pressed, do a search with the given string
    const handleSearch = async (event: ChangeEvent) => {
        event.preventDefault();

        await search(searchString);
    }

    // When an officer is selected, call the callback function with the NIF
    const handleClick = (nif: string) => {
        callbackFunction(nif);
    }

    // Build the officers' cards
    let officersCards = [];

    for (let i = 0; i < officers.length; i++) {
        officersCards.push(
            <OfficerCard
                key={"officer" + officers[i]["nif"]}
                name={`[${officers[i]["callsign"]}] ${officers[i]["patent"]} ${officers[i]["name"]}`}
                nif={officers[i]["nif"]}
                status={officers[i]["status"]}
                callback={handleClick}
                disabled={disabled}
            />
        );
    }

    return(
        <div className={style.officerListMainDiv}>
            {/*Barra de pesquisa*/}
            {/*@ts-ignore*/}
            <form onSubmit={handleSearch}>
                <div className={style.officerListSearchDiv}>
                    {/*TODO: Label looks awful when there's someting written on the field*/}
                    <DefaultOutlinedTextField
                        value={searchString}
                        type={"text"}
                        label={"Pesquisar por efetivo"}
                        backgroundColor={"var(--portalseguranca-color-background-light)"}
                        textColor={"black"}
                        disabled={disabled}
                        onChange={(event) => setSearchString(event.target.value)}
                        sx={{
                            width: "70%"
                        }}
                    />
                    <DefaultButton
                        type={"submit"}
                        buttonColor={"var(--portalseguranca-color-accent)"}
                        darkTextOnHover
                        disabled={disabled}
                        sx={{
                            padding: "5px"
                        }}
                    >Pesquisar</DefaultButton>
                </div>
            </form>

            {/*Loader para lista de efetivos*/}
            <div
                className={style.officerListListDiv}
                style={loading ? {alignItems: "center", justifyContent: "center"}: {display: "none"}}
            >
                <Loader/>
            </div>

            {/*Lista de efetivos*/}
            <div
                className={style.officerListListDiv}
                style={loading ? {display: "none"}: {}}
                hidden={loading}
            >
                {officersCards}
            </div>
        </div>
    );
}

export default OfficerList;