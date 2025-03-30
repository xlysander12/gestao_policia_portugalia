import {useForceData} from "../../../../hooks";
import {useEffect, useState} from "react";
import {make_request} from "../../../../utils/requests.ts";
import InformationCard from "../../../../components/InformationCard";
import style from "./patrol-card.module.css";
import {DefaultTypography} from "../../../../components/DefaultComponents";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import Gate from "../../../../components/Gate/gate.tsx";
import {Skeleton} from "@mui/material";
import moment from "moment";
import { MinifiedPatrolData } from "@portalseguranca/api-types/patrols/output";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";

type PatrolCardProps = {
    patrolInfo: MinifiedPatrolData
    callback: (id: string) => void
}
function PatrolCard({patrolInfo, callback}: PatrolCardProps) {
    // Get the force data from context
    const [, getForceData] = useForceData();

    // Set states
    const [loading, setLoading] = useState<boolean>(true);
    const [officers, setOfficers] = useState<(MinifiedOfficerData & {force: string})[] >([]);
    const [addEtc, setAddEtc] = useState<boolean>(false);

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
                    force: officerResponseJson.meta.force
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

        exec();
    }, [patrolInfo.id]);

    return (
        <InformationCard
            statusColor={patrolInfo.canceled ? "gray": (patrolInfo.end ? "red" : "lightgreen")}
            callback={() => callback(patrolInfo.id)}
        >
            <div className={style.patrolCardMain}>
                <div className={style.patrolCardLeft}>
                    <DefaultTypography fontSize={"larger"}>
                        Patrulha #{patrolInfo.id.toUpperCase()} - {patrolInfo.canceled ? "Cancelada": (patrolInfo.end ? "Terminada": "A decorrer...")}
                    </DefaultTypography>

                    <DefaultTypography color={"gray"}>{getObjectFromId(patrolInfo.type, getForceData(patrolForce).patrol_types)?.name} {patrolInfo.unit ? ` - ${getObjectFromId(patrolInfo.unit, getForceData(patrolForce).special_units)?.name}`: ""}</DefaultTypography>
                    <DefaultTypography color={"gray"}>Duração: {patrolInfo.end ? moment.duration(moment.unix(patrolInfo.end).diff(moment.unix(patrolInfo.start))).format("hh[h]mm", {trim: false}): "N/A"}</DefaultTypography>
                </div>
                <div className={style.patrolCardMiddle}>
                    <Gate show={loading}>
                        {patrolInfo.officers.map((_, index) => (
                            index < 4 ? <Skeleton key={`skeleton#${index}`} variant={"text"} width={"100%"} height={"19.5px"} animation={"wave"} />: null
                        ))}
                    </Gate>

                    <Gate show={!loading}>
                        {officers.map((officer, index) => (
                            <DefaultTypography key={`officer#${index}`} color={"gray"} fontSize={"small"}>[{officer.callsign}] {getObjectFromId(officer.patent, getForceData(officer.force).patents)?.name} {officer.name}</DefaultTypography>
                        ))}
                        <Gate show={addEtc}>
                            <DefaultTypography color={"gray"} fontSize={"small"}>...</DefaultTypography>
                        </Gate>
                    </Gate>
                </div>
                <div className={style.patrolCardRight}>
                    <DefaultTypography fontSize={"small"} color={"gray"}>{moment.unix(patrolInfo.start).calendar()}</DefaultTypography>
                </div>
            </div>
        </InformationCard>
    )
}

export default PatrolCard;