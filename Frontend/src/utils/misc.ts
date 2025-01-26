import { RequestError } from "@portalseguranca/api-types/index.ts";
import {make_request} from "./requests.ts";
import {MinifiedOfficerData, OfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {toast} from "react-toastify";

export function toHoursAndMinutes(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${padToTwoDigits(hours)}:${padToTwoDigits(minutes)}`;
}
export function padToTwoDigits(num: number) {
    return num.toString().padStart(2, "0");
}

export async function getOfficerFromNif(nif: number): Promise<OfficerData | MinifiedOfficerData> {
    const response = await make_request(`/officers/${nif}`, "GET");
    const responseJson: RequestError | OfficerInfoGetResponse = await response.json();

    if (!response.ok) {
        toast("responseJson.message", {type: "error"});
        throw new Error((responseJson as RequestError).message);
    }

    return (responseJson as OfficerInfoGetResponse).data;
}