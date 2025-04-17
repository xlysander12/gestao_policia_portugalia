import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {useEffect, useState} from "react";
import PatrolInfoModal from "./modals/PatrolInfoModal";
import {PatrolCreator} from "../../components/PatrolCreator";
import {useParams} from "react-router-dom";
import {PatrolPicker} from "../../components/PatrolPicker";
import { MinifiedPatrolData } from "@portalseguranca/api-types/patrols/output";

function Patrols() {
    // Get the patrol id from the URL
    // ! This might not be present
    const {patrolId} = useParams();

    const [selectedPatrol, setSelectedPatrol] = useState<string | null>(null);
    const [patrolInfoModalOpen, setPatrolInfoModalOpen] = useState<boolean>(false);

    function handleChangeViewedPatrol(patrol: MinifiedPatrolData) {
        setSelectedPatrol(patrol.id);
        setPatrolInfoModalOpen(true);
    }

    // When the page loads, verify if there's a patrol id in the URL
    useEffect(() => {
        if (patrolId) {
            setSelectedPatrol(patrolId);
            setPatrolInfoModalOpen(true);
        }
    }, [patrolId]);

    return (
        <>
            <ScreenSplit
                leftSideComponent={<PatrolCreator />}
                leftSidePercentage={30}
            >
                <PatrolPicker
                    callback={handleChangeViewedPatrol}
                />
            </ScreenSplit>

            <PatrolInfoModal open={patrolInfoModalOpen} onClose={() => setPatrolInfoModalOpen(false)} id={selectedPatrol} />
        </>
    )
}

export default Patrols;