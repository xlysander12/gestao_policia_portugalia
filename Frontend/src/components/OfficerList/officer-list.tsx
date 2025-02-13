import {ReactElement, useEffect, useState, FormEvent} from "react";
import style from "./officer-list.module.css";
import Loader from "../Loader/loader";
import {make_request} from "../../utils/requests";
import {DefaultButton, DefaultOutlinedTextField} from "../DefaultComponents";
import {MinifiedOfficerData, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import InformationCard from "../InformationCard";
import {getObjectFromId} from "../../forces-data-context.ts";
import {useForceData, useWebSocketEvent} from "../../hooks";

type OfficerCardProps = {
    name: string,
    nif: number,
    status: number,
    callback: (nif: number) => void,
    disabled: boolean
}

function OfficerCard({name, nif, status, callback, disabled}: OfficerCardProps): ReactElement {
    // Get the force's data from context
    const [forceData] = useForceData();

    const handleDivClick = () => {
        if (disabled)
            return;

        callback(nif);
    }

    return(
        <InformationCard
            disabled={disabled}
            statusColor={getObjectFromId(status, forceData.statuses)!.color}
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
    const [forceData] = useForceData();

    // Initialize state
    const [officers, setOfficers] = useState<MinifiedOfficerData[] | []>([]);
    const [searchString, setSearchString] = useState("");
    const [loading, setLoading] = useState(false);

    // WebSocket connection
    useWebSocketEvent("officers", () => {
        search(searchString, false);
    });

    // Function to fetch the backend and get the officers depending on the search query
    const search = async (query?: string, showLoading: boolean = true) => {
        // Set the loading state to true
        if (showLoading) {
            setLoading(true);
        }

        // Send the request to the API to get the results from the search
        const response = await make_request(`/officers${query ? `?search=${query}`: ""}`, "GET");

        // If the response status is not 200, then there was an error
        if (response.status !== 200) {
            const response_json = await response.json();
            console.log(response_json["message"]);
            return;
        }

        // Get the response as JSON
        const responseJSON: OfficerListResponse = await response.json();

        // Update the state with the new officers
        setOfficers(responseJSON.data);

        // Set the loading state to false
        if (showLoading) {
            setLoading(false);
        }
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
    const officersCards = [];

    for (let i = 0; i < officers.length; i++) {
        officersCards.push(
            <OfficerCard
                key={"officer" + officers[i].nif}
                name={`[${officers[i]["callsign"]}] ${getObjectFromId(officers[i].patent, forceData.patents)!.name} ${officers[i]["name"]}`}
                nif={officers[i]["nif"]}
                status={officers[i].status}
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