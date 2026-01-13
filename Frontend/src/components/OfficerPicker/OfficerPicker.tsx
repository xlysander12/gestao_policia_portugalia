import {ReactElement, useEffect, useState} from "react";
import style from "./officer-picker.module.css";
import {make_request} from "../../utils/requests";
import {DefaultOutlinedTextField, DefaultSearch, DefaultTypography} from "../DefaultComponents";
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
import {
    FormControlLabel,
    IconButton,
    Menu,
    MenuItem,
    Switch
} from "@mui/material";
import TuneIcon from '@mui/icons-material/Tune';

type OfficerCardProps = {
    name: string
    nif: number
    statusColor: string
    callback: (nif: number) => void
    disabled: boolean
    selected?: boolean
}

function OfficerCard({name, nif, statusColor, callback, disabled, selected}: OfficerCardProps): ReactElement {
    const handleDivClick = () => {
        if (disabled)
            return;

        callback(nif);
    }

    return(
        <InformationCard
            disabled={disabled}
            selected={selected}
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
    selected?: number
}

function OfficerPicker({callback, filter = () => true, disabled = false, patrol = false, selected}: OfficerListProps) {
    // Get the force's data from Context
    const [forceData, getForceData, forces] = useForceData();

    // Initialize state
    const [officers, setOfficers] = useState<MinifiedOfficerData[] | []>([]);
    const [searchFilters, setSearchFilters] = useState<{key: string, value: string}[]>([]);

    const [advanced, setAdvanced] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    // WebSocket connections
    useWebSocketEvent(SOCKET_EVENT.OFFICERS, () => {
        void search(searchFilters, false);
    });

    useWebSocketEvent<OfficerActivitySocket>(SOCKET_EVENT.ACTIVITY, (data) => {
        // If the data is not a justification, return
        if (data.type !== "justification") return;

        // If it's just the addition of a new justification, it wasn't approved yeu
        if (data.action === "add") return;

        // Otherwise, refresh the officers
        void search(searchFilters, false);
    });

    // Function to fetch the backend and get the officers depending on the search query
    const search = async (query?: {key: string, value: string}[], showLoading: boolean = true, signal?: AbortSignal) => {
        // Set the loading state to true
        if (showLoading) {
            setLoading(true);
        }

        // Send the request to the API to get the results from the search
        const response = await make_request("/officers", "GET", {
            queryParams: [
                ...(query ?? []),
                {key: "patrol", value: patrol ? "true" : "false"}
            ],
            signal
        });
        const response_json = await response.json() as OfficerListResponse;

        // If the response status is not 200, then there was an error
        if (response.status !== 200) {
            return;
        }

        // Update the state with the new officers
        setOfficers(response_json.data);

        // Set the loading state to false
        if (showLoading) {
            setLoading(false);
        }
    }

    // Every time the search method changes, reload the list
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        void search(searchFilters, true, signal);

        return () => controller.abort();
    }, [JSON.stringify(searchFilters)]);

    // When an officer is selected, call the callback function with the NIF
    const handleClick = (nif: number) => {
        callback(officers.find((officer) => officer.nif === nif)!);
    }

    return (
        <>
            <div className={style.officerListMainDiv}>
                {/*Barra de pesquisa*/}
                <ManagementBar>
                    <div className={style.officerListManagementDiv}>
                        <Gate show={!advanced}>
                            <DefaultOutlinedTextField
                                size={"small"}
                                value={searchFilters.filter(filter => filter.key === "search")[0]?.value ?? ""}
                                type={"text"}
                                label={"Pesquisar por efetivo"}
                                alternateColor
                                disabled={disabled}
                                onChange={(event) => setSearchFilters([{
                                    key: "search",
                                    value: event.target.value
                                }])}
                                fullWidth
                                sx={{
                                    flex: 1
                                }}
                            />
                        </Gate>

                        <Gate show={advanced}>
                            <DefaultSearch
                                size={"small"}
                                placeholder={"Pesquisar por efetivo"}
                                disabled={disabled}
                                options={[
                                    {key: "patent", label: "Patente", type: "option", options: forceData.patents.map((patent) => ({key: patent.id.toString(), label: patent.name}))},
                                    {key: "patent-category", label: "Categoria", type: "option", options: forceData.patentCategories.map(category => ({key: category.id.toString(), label: category.name}))},
                                    {key: "status", label: "Status", type: "option", options: forceData.statuses.map(status => ({key: status.id.toString(), label: status.name}))},
                                    {key: "force", label: "Força", type: "option", options: forces.map((force) => ({key: force, label: force.toUpperCase()}))},
                                ]}
                                callback={(options) => {
                                    setSearchFilters(options);
                                }}
                                fullWidth
                                sx={{
                                    flex: 1
                                }}
                            />
                        </Gate>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}
                        >
                            <IconButton
                                onClick={(event) => {
                                    setMenuAnchorEl(event.currentTarget);
                                    setMenuOpen(true);
                                }}
                            >
                                <TuneIcon
                                    sx={{
                                        fill: "var(--portalseguranca-color-text-light)"
                                    }}
                                />
                            </IconButton>
                        </div>

                    </div>
                </ManagementBar>

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
                                    selected={selected === officer.nif}
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

            <Menu
                open={menuOpen}
                anchorEl={menuAnchorEl}
                onClose={() => {
                    setMenuOpen(false);
                    setMenuAnchorEl(null);
                }}
            >
                <MenuItem>
                    <FormControlLabel
                        label={"Pesquisa Avançada"}
                        checked={advanced}
                        control={
                            <Switch
                                onChange={(event) => {
                                    setMenuOpen(false);
                                    setMenuAnchorEl(null);
                                    setAdvanced(event.target.checked);
                                    setSearchFilters([]);
                                }}
                            />
                        }
                    />
                </MenuItem>
            </Menu>
        </>
    );
}

export default OfficerPicker;