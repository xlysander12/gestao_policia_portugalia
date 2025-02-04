import {useContext} from "react";
import {ForceData, ForcesDataContext} from "../forces-data-context.ts";

type ForceDataGetter = (forceName: string) => ForceData;

export function useForceData(): [ForceData, ForceDataGetter] {
    // First, check if there is a force in the local storage
    const force = localStorage.getItem("force");
    if (!force) {
        throw new Error("No force found in local storage");
    }

    // Get the forces' data from context
    const forcesData = useContext(ForcesDataContext);

    // Create function to get the force's data from name
    function getForceData(forceName: string) {
        if (!forcesData[forceName]) {
            throw new Error(`Force ${forceName} not found in forces data context`);
        }

        return forcesData[forceName];
    }

    return [getForceData(force), getForceData];
}

export default useForceData;