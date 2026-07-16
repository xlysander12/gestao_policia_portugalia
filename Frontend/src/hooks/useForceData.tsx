import {useContext} from "react";
import { ForcesData } from "../contexts/forces-data";
import {ForceData} from "../contexts/forces-data.ts";
import {CurrentForce} from "../contexts/current-force.ts";

type ForceDataGetter = (forceName: string) => ForceData;

function useForceData(): [ForceData, ForceDataGetter, string[]] {
    // Get the forces' data from context
    const forcesData = useContext(ForcesData);

    // First, check if there is a force in the local storage
    const force = useContext(CurrentForce);

    // Create function to get the force's data from name
    function getForceData(forceName: string) {
        if (!forcesData[forceName]) {
            throw new Error(`Force ${forceName} not found in forces data context`);
        }

        return forcesData[forceName];
    }

    if (!force) {
        return [forcesData["default"], getForceData, []];
    }

    return [getForceData(force), getForceData, Object.keys(forcesData)];
}

export default useForceData;