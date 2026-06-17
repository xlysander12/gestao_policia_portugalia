import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import {useState} from "react";
import PatrolInfoModal from "./modals/PatrolInfoModal";
import {PatrolCreator} from "../../components/PatrolCreator";
import {useParams} from "react-router-dom";
import {PatrolPicker} from "../../components/PatrolPicker";
import { MinifiedPatrolData } from "@portalseguranca/api-types/patrols/output";

function Patrols() {
    // Get the patrol id from the URL
    // ! This might not be present
    const {patrolId} = useParams();

    const [selectedPatrol, setSelectedPatrol] = useState<string | null>(patrolId ?? null);

    function handleChangeViewedPatrol(patrol: MinifiedPatrolData) {
        setSelectedPatrol(patrol.id);
    }

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

            <PatrolInfoModal open={selectedPatrol != null} onClose={() => setSelectedPatrol(null)} id={selectedPatrol} />
        </>
    )
}

export default Patrols;