import {useForceData} from "../../../hooks";
import {useEffect, useState} from "react";
import {make_request} from "../../../utils/requests.ts";
import InformationCard from "../../InformationCard";
import style from "./patrol-card.module.css";
import {DefaultTypography} from "../../DefaultComponents";
import Gate from "../../Gate/gate.tsx";
import {Chip, Divider, IconButton, Skeleton, Typography} from "@mui/material";
import moment from "moment";
import { MinifiedPatrolData } from "@portalseguranca/api-types/patrols/output";
import { MinifiedOfficerData, OfficerInfoGetResponse } from "@portalseguranca/api-types/officers/output";
import {CalendarMonthOutlined, GroupWorkOutlined, MoreVertOutlined, PeopleAltOutlined} from "@mui/icons-material";
import { getObjectFromId } from "../../../utils/misc.ts";

type PatrolCardProps = {
    patrolInfo: MinifiedPatrolData
    callback: (patrol: MinifiedPatrolData) => void
}
function PatrolCard({patrolInfo, callback}: PatrolCardProps) {
    // Get the force data from context
    const [, getForceData] = useForceData();

    // Set states
    const [loading, setLoading] = useState<boolean>(true);
    const [officers, setOfficers] = useState<(MinifiedOfficerData & {force: string})[] >([]);
    const [addEtc, setAddEtc] = useState<boolean>(false);
    const [patrolDuration, setPatrolDuration] = useState<number>(0);

    // Getting the patrol force from the id
    const patrolForce = patrolInfo.id.match(/([a-z]+)(\d+)$/)![1];

    async function getOfficersDetails(): Promise<(MinifiedOfficerData & {force: string})[]> {
        const temp: (MinifiedOfficerData & {force: string})[] = [];
        let i = 0;

        for (const nif of patrolInfo.officers) {
            if (patrolInfo.officers.length > 4) {
                if (i < 3) {
                    i++;
                } else {
                    setAddEtc(true);
                    break;
                }
            } else {
                setAddEtc(false);
            }

            const officerResponse = await make_request(`/officers/${nif}?patrol=true`, "GET");

            if (!officerResponse.ok) {
                temp.push({
                    name: "Desconhecido",
                    nif: nif,
                    callsign: "N/A",
                    patent: 0,
                    status: 0,
                    force: localStorage.getItem("force")!
                });
            } else {
                const officerResponseJson: OfficerInfoGetResponse = await officerResponse.json();
                temp.push({
                    ...officerResponseJson.data,
                    force: officerResponseJson.data.force ?? localStorage.getItem("force")!
                });
            }
        }

        return temp;
    }

    useEffect(() => {
        const exec = async () => {
            setLoading(true);

            setOfficers(await getOfficersDetails());

            setLoading(false);
        }

        void exec();
    }, [patrolInfo.id, JSON.stringify(patrolInfo.officers)]);

    // Loop to keep updating the duration of ongoing patrols
    useEffect(() => {
        if (patrolInfo.end !== null) return;

        const loop = setInterval(() => {
           setPatrolDuration(moment().diff(moment.unix(patrolInfo.start)));
        }, 500);

        return () => {
            setPatrolDuration(0);
            clearInterval(loop);
        }
    }, [patrolInfo.start]);

    return (
        <InformationCard
            statusColor={patrolInfo.canceled ? "gray": (patrolInfo.end ? "red" : "lightgreen")}
            callback={() => callback(patrolInfo)}
        >
            <div className={style.patrolCardMain}>
                <div className={style.patrolCardSection}>
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <Typography>#{patrolInfo.id.toUpperCase()}</Typography>

                        <Chip
                            size={"small"}
                            color={
                                patrolInfo.canceled
                                    ? "default"
                                    : (
                                        patrolInfo.end
                                            ? "error"
                                            : "success"
                                    )
                            }
                            label={
                                patrolInfo.canceled
                                    ? "CANCELADA"
                                    : (
                                        patrolInfo.end
                                            ? "TERMINADA"
                                            : "EM CURSO"
                                    )
                            }
                            sx={{justifySelf: "flex-end", marginRight: "5px"}}
                        />
                    </div>

                    <Typography color={"textSecondary"}>{getObjectFromId(patrolInfo.type, getForceData(patrolForce).patrol_types)!.name}</Typography>
                    <Typography color={"textSecondary"}>
                        Duração: {
                        patrolInfo.end
                            ? moment.duration(moment.unix(patrolInfo.end).diff(moment.unix(patrolInfo.start))).format("hh[h]mm", {trim: false})
                            : moment.duration(patrolDuration).format("hh:mm:ss", {trim: false})}
                    </Typography>
                </div>

                <Divider flexItem orientation={"vertical"} />

                <div className={style.patrolCardSection} style={{flexDirection: "row", alignItems: "center", gap: "10px"}}>
                    <CalendarMonthOutlined color={"disabled"}/>

                    <div className={"patrolCardSection"}>
                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "5px"
                        }}>
                            <Typography color={"textSecondary"}>Início:</Typography>
                            <Typography>{moment.unix(patrolInfo.start).format("DD/MM/YYYY HH:mm")}</Typography>
                        </div>

                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "5px"
                        }}>
                            <Typography color={"textSecondary"}>Fim:</Typography>
                            <Typography>{
                                patrolInfo.end != null
                                    ? moment.unix(patrolInfo.end).format("DD/MM/YYYY HH:mm")
                                    : "N/A"
                            }</Typography>
                        </div>
                    </div>
                </div>

                <Divider flexItem orientation={"vertical"} />

                <div className={style.patrolCardSection}>
                    <div className={style.titleDiv}>
                        <GroupWorkOutlined color={"disabled"}/>
                        <Typography color={"textSecondary"}>Unidade Especial</Typography>
                    </div>
                    <Typography>
                        {
                            patrolInfo.unit != null
                            ? getObjectFromId(patrolInfo.unit, getForceData(patrolForce).special_units)!.name
                            : "N/A"
                        }
                    </Typography>
                </div>

                <Divider flexItem orientation={"vertical"} />

                <div className={style.patrolCardSection}>
                    <div className={style.titleDiv}>
                        <PeopleAltOutlined color={"disabled"} />
                        <Typography color={"textSecondary"}>Membros ({patrolInfo.officers.length})</Typography>
                    </div>
                    <Typography>
                        {
                            officers.map(officer => {
                                return (
                                    <Typography key={officer.nif}>
                                        [{officer.callsign}] {getObjectFromId(officer.patent, getForceData(officer.force).patents)!.name} {officer.name}
                                    </Typography>
                                );
                            })
                        }
                    </Typography>
                </div>

                <Divider flexItem orientation={"vertical"} />

                <div className={style.patrolCardSection}>
                    <Typography color={"textSecondary"} sx={{textAlign: "center"}}>Ações</Typography>
                    <IconButton><MoreVertOutlined /></IconButton>
                </div>
            </div>
        </InformationCard>
    )
}

export default PatrolCard;