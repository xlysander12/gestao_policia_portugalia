import {ReactElement, useEffect, useState, FormEvent} from "react";
import style from "./officer-picker.module.css";
import {make_request} from "../../utils/requests";
import {DefaultButton, DefaultOutlinedTextField, DefaultTypography} from "../DefaultComponents";
import {
    MinifiedOfficerData,
    OfficerListResponse
} from "@portalseguranca/api-types/officers/output";
import InformationCard from "../InformationCard";
import {getObjectFromId} from "../../forces-data-context.ts";
import {useForceData, useWebSocketEvent} from "../../hooks";
import ManagementBar from "../ManagementBar";
import Gate from "../Gate/gate.tsx";
import {Loader} from "../Loader";
import { SOCKET_EVENT } from "@portalseguranca/api-types";
import { OfficerActivitySocket } from "@portalseguranca/api-types/officers/activity/output";

type OfficerCardProps = {
    name: string
    nif: number
    statusColor: string
    callback: (nif: number) => void
    disabled: boolean
}

function OfficerCard({name, nif, statusColor, callback, disabled}: OfficerCardProps): ReactElement {
    const handleDivClick = () => {
        if (disabled)
            return;

        callback(nif);
    }

    return(
        <InformationCard
            disabled={disabled}
            statusColor={statusColor}
            callback={handleDivClick}
        >
            <div className={style.officerListCardDiv}>
                <DefaultTypography color={"white"}>{name}</DefaultTypography>
                <DefaultTypography color={"gray"} fontSize={"1rem"}>(#{nif})</DefaultTypography>
            </div>
        </InformationCard>
    );

}


type OfficerListProps = {
    callback: (officer: MinifiedOfficerData) => void
    filter?: (officer: MinifiedOfficerData) => boolean
    disabled?: boolean
    patrol?: boolean
}

function OfficerPicker({callback, filter = () => true, disabled = false, patrol = false}: OfficerListProps) {
    // Get the force's data from Context
    const [forceData, getForceData] = useForceData();

    // Initialize state
    const [officers, setOfficers] = useState<MinifiedOfficerData[] | []>([]);
    const [searchString, setSearchString] = useState("");
    const [loading, setLoading] = useState(false);

    // WebSocket connections
    useWebSocketEvent(SOCKET_EVENT.OFFICERS, () => {
        void search(searchString, false);
    });

    useWebSocketEvent<OfficerActivitySocket>(SOCKET_EVENT.ACTIVITY, (data) => {
        // If the data is not a justification, return
        if (data.type !== "justification") return;

        // If it's just the addition of a new justification, it wasn't approved yeu
        if (data.action === "add") return;

        // Otherwise, refresh the officers
        void search(searchString, false);
    });

    // Function to fetch the backend and get the officers depending on the search query
    const search = async (query?: string, showLoading: boolean = true, signal?: AbortSignal) => {
        // Set the loading state to true
        if (showLoading) {
            setLoading(true);
        }

        // Send the request to the API to get the results from the search
        const response = await make_request(`/officers?patrol=${patrol ? "true": "false"}${query ? `&search=${query}&`: ""}`, "GET", {signal});
        const response_json = await response.json() as OfficerListResponse;

        // If the response status is not 200, then there was an error
        if (response.status !== 200) {
            console.log(response_json.message);
            return;
        }

        // Update the state with the new officers
        setOfficers(response_json.data);

        // Set the loading state to false
        if (showLoading) {
            setLoading(false);
        }
    }

    // On component mount, do an initial search with an empty string
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        void search(undefined, true, signal);

        return () => controller.abort();
    }, []);


    // When the search button is pressed, do a search with the given string
    const handleSearch = async (event: FormEvent) => {
        event.preventDefault();

        await search(searchString);
    }

    // When an officer is selected, call the callback function with the NIF
    const handleClick = (nif: number) => {
        callback(officers.find((officer) => officer.nif === nif)!);
    }

    return(
        <div className={style.officerListMainDiv}>
            {/*Barra de pesquisa*/}
            <form onSubmit={handleSearch}>
                <ManagementBar>
                    <div className={style.officerListManagementDiv}>
                        <DefaultOutlinedTextField
                            size={"small"}
                            value={searchString}
                            type={"text"}
                            label={"Pesquisar por efetivo"}
                            alternateColor
                            disabled={disabled || loading}
                            onChange={(event) => setSearchString(event.target.value)}
                            sx={{
                                width: "70%",
                                flex: 1
                            }}
                        />
                        <DefaultButton
                            type={"submit"}
                            buttonColor={"var(--portalseguranca-color-accent)"}
                            disabled={disabled || loading}
                            sx={{
                                padding: "5px",
                                flex: 0.2,
                                minWidth: "fit-content"
                            }}
                        >
                            Pesquisar
                        </DefaultButton>
                    </div>
                </ManagementBar>
            </form>

            {/*Lista de efetivos*/}
            <div className={style.officerListListDiv}>
                <Gate show={loading}>
                    <Loader fullDiv />
                </Gate>

                <Gate show={!loading}>
                    {officers.filter(filter).map((officer) => {
                        let patent;
                        if (patrol) {
                            patent = getObjectFromId(officer.patent, getForceData(officer.force!).patents)!.name;
                        } else {
                            patent = getObjectFromId(officer.patent, forceData.patents)!.name;
                        }

                        let statusColor;
                        if (patrol) {
                            statusColor = getObjectFromId(officer.status, getForceData(officer.force!).statuses)!.color;
                        } else {
                            statusColor = getObjectFromId(officer.status, forceData.statuses)!.color;
                        }

                        return (
                            <OfficerCard
                                key={`officerlist#${officer.nif}`}
                                name={`[${officer.callsign}] ${patent} ${officer.name}`}
                                nif={officer.nif}
                                statusColor={statusColor}
                                callback={handleClick}
                                disabled={disabled}
                            />
                        )
                    })}
                </Gate>

                <Gate show={!loading && officers.length === 0}>
                    <DefaultTypography
                        color={"var(--portalseguranca-color-text-dark)"}
                        fontSize={"xx-large"}
                        sx={{alignSelf: "center"}}
                    >
                        Sem Registos
                    </DefaultTypography>
                </Gate>
            </div>
        </div>
    );
}

export default OfficerPicker;