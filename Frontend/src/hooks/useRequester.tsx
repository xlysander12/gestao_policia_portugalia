import {BaseResponse, RequestError} from "@portalseguranca/api-types";
import { useState } from "react";
import {make_request, MakeRequestOptions, RequestMethod} from "../utils/requests.ts";

type Response = {
    status: number
    success: boolean
    error?: RequestError
    json?: BaseResponse
}

function useRequester() {
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    async function request<T>(url: string, method: RequestMethod, options: MakeRequestOptions<T>): Promise<Response> {
        // First, increment the count
        setCount(count => count + 1);

        // Then, ensure loading is set to true
        setLoading(true);

        // Then, try to fetch the data
        const response = await make_request<T>(url, method, options)

        // After that, if the count is 1, set loading to false
        if (count === 1) {
            setLoading(false);
        }

        // Decrement the count
        setCount(count => count - 1);

        // Finally, return the response
        return {
            status: response.status,
            success: response.ok,
            error: !response.ok ? await response.json() : undefined,
            json: response.ok ? await response.json() : undefined
        }
    }

    return {request, loading}
}

export default useRequester;