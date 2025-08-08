import {Modal, ModalSection} from "../../../../components/Modal";
import moment from "moment";
import OfficerList from "../../../../components/OfficerList";
import {useEffect, useState} from "react";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import { ForceTopHoursInWeekResponse } from "@portalseguranca/api-types/util/output";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import {useForceData} from "../../../../hooks";
type Tops = {
    rank: number,
    officer: MinifiedOfficerData,
    minutes: number
}[]

type TopHoursModalProps = {
    open: boolean;
    onClose: () => void;
    week_end: number;
}
function TopHoursModal(props: TopHoursModalProps) {
    // Get force's data from context
    const [forceData] = useForceData();

    // Loading State
    const [loading, setLoading] = useState(true);

    // State to hold top list
    const [tops, setTops] = useState<Tops>([]);

    async function fetchTopHours(signal: AbortSignal) {
        // Set loading to true
        setLoading(true);

        // Fetch tops from API
        const response = await make_request(`/util/top-hours?week_end=${props.week_end}`, RequestMethod.GET, {signal});
        const responseJson = (await response.json()) as ForceTopHoursInWeekResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            props.onClose();
            return;
        }

        // For every top, fetch the Officer's information and add to the list
        const tops: Tops = await Promise.all(responseJson.data.map(async top => {
            // Fetch the officer's information
            const officerResponse = await make_request(`/officers/${top.nif}`, RequestMethod.GET, {signal});
            const officerResponseJson = await officerResponse.json() as OfficerInfoGetResponse;

            if (!officerResponse.ok) {
                return {
                    rank: top.rank,
                    officer: {
                        name: `Desconhecido (#${top.nif})`,
                        nif: top.nif,
                        status: forceData.statuses[0].id,
                        callsign: "N/A",
                        patent: forceData.patents[0].id,
                        force: localStorage.getItem("force")!
                    },
                    minutes: top.minutes
                }
            } else {
                return {
                    rank: top.rank,
                    officer: {...officerResponseJson.data, name: `${officerResponseJson.data.name} (#${top.rank} - ${top.minutes} mins)`},
                    minutes: top.minutes
                }
            }
        }));

        // Apply the tops list to the state
        setTops(tops);
        
        // Set loading to false
        setLoading(false);
    }

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        if (props.open) {
            void fetchTopHours(signal);
        }

        return () => controller.abort();
    }, [props.open]);

    return (
        <Modal
            open={props.open}
            onClose={props.onClose}
            title={`Top Horas para a Semana com final em ${moment.unix(props.week_end).format("DD-MM-YYYY")}`}
        >
            <Gate show={loading}>
                <Loader fullDiv />
            </Gate>

            <Gate show={!loading}>
                <ModalSection title={"Lista de Top"}>
                    <OfficerList
                        invisibleDisabled
                        startingOfficers={tops.sort((a, b) => a.rank > b.rank ? 1 : 0).map(top => top.officer)}
                        changeCallback={() => {}}
                    />
                </ModalSection>
            </Gate>
        </Modal>
    );
}

export default TopHoursModal;