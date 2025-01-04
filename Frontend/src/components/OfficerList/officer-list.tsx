import {ReactElement, useEffect, useState, FormEvent, useContext} from "react";
import style from "./officer-list.module.css";
import Loader from "../Loader/loader";
import {make_request} from "../../utils/requests";
import {DefaultButton, DefaultOutlinedTextField} from "../DefaultComponents";
import {MinifiedOfficerData, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import InformationCard from "../InformationCard";
import {ForceDataContext, getObjectFromId, Patent, Status} from "../../force-data-context.ts";

type OfficerCardProps = {
    name: string,
    nif: number,
    status: string,
    callback: (nif: number) => void,
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
                return ["#00ff00", "#000000"];
            case "Inativo":
                return ["#ff0000", "#FFFFFF"];
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
        <InformationCard
            disabled={disabled}
            statusColor={statusDivColor}
            callback={handleDivClick}
        >
            <div>
                <p className={style.officerListCardName}>{name}</p>
                <p className={style.officerListCardNif}>(#{nif})</p>
            </div>

            {/*<div className={style.officerListCardStatus} style={{backgroundColor: statusDivColor}}>*/}
            {/*    <p className={style.officerListCardStatusText} style={{color: statusTextColor}}>{this.props.status}</p>*/}
            {/*</div>*/}
        </InformationCard>
    );

}


type OfficerListProps = {
    callbackFunction: (nif: number) => void,
    disabled?: boolean

}

function OfficerList({callbackFunction, disabled = false}: OfficerListProps) {
    // Get the force's data from Context
    const forceData = useContext(ForceDataContext);

    // Initialize state
    const [officers, setOfficers] = useState<MinifiedOfficerData[] | []>([]);
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
        let responseJSON: OfficerListResponse = await response.json();

        // Update the state with the new officers
        setOfficers(responseJSON.data);

        // Set the loading state to false
        setLoading(false);
    }

    // On component mount, do an initial search with an empty string
    useEffect(() => {
        search();
    }, []);


    // When the search button is pressed, do a search with the given string
    const handleSearch = async (event: FormEvent) => {
        event.preventDefault();

        await search(searchString);
    }

    // When an officer is selected, call the callback function with the NIF
    const handleClick = (nif: number) => {
        callbackFunction(nif);
    }

    // Build the officers' cards
    let officersCards = [];

    for (let i = 0; i < officers.length; i++) {
        officersCards.push(
            <OfficerCard
                key={"officer" + officers[i]["nif"]}
                name={`[${officers[i]["callsign"]}] ${(getObjectFromId(officers[i]["patent"], forceData.patents) as Patent).name} ${officers[i]["name"]}`}
                nif={officers[i]["nif"]}
                status={(getObjectFromId(officers[i]["status"], forceData.statuses) as Status).name}
                callback={handleClick}
                disabled={disabled}
            />
        );
    }

    return(
        <div className={style.officerListMainDiv}>
            {/*Barra de pesquisa*/}
            <form onSubmit={handleSearch}>
                <div className={style.officerListSearchDiv}>
                    {/*TODO: Label looks awful when there's someting written on the field*/}
                    <DefaultOutlinedTextField
                        size={"small"}
                        value={searchString}
                        type={"text"}
                        label={"Pesquisar por efetivo"}
                        alternateColor
                        disabled={disabled}
                        onChange={(event) => setSearchString(event.target.value)}
                        sx={{
                            width: "70%"
                        }}
                    />
                    <DefaultButton
                        type={"submit"}
                        buttonColor={"var(--portalseguranca-color-accent)"}
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
            >
                {officersCards}
            </div>
        </div>
    );
}

export default OfficerList;