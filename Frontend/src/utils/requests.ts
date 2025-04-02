// This function will handle all requests to the backend
// It will be used by all components that need to make requests
// It will be a wrapper around the fetch API, making it easier to use
import { RequestError } from "@portalseguranca/api-types";
import {BASE_API_URL, BASE_URL} from "./constants";

export enum RequestMethod {
    GET = "GET",
    POST= "POST",
    PATCH = "PATCH",
    PUT = "PUT",
    DELETE = "DELETE"
}

export type MakeRequestOptions<Body> = Partial<{
    body: Body | null,
    queryParams: {key: string, value: string}[] | null,
    force: string,
    useAuth: boolean,
    useBaseAPIURL: boolean,
    redirectToLoginOn401: boolean
    errorPageOn500: boolean
    signal: AbortSignal | null
}>
// ! 'useAuth' option is deprecated, and such, has been deleted
export async function make_request<BodyType>(url: string, method: RequestMethod | ("GET" | "POST" | "PATCH" | "PUT" | "DELETE"),
                                   {
                                       body = null,
                                       queryParams = null,
                                       force = <string>localStorage.getItem("force"),
                                       useBaseAPIURL = true,
                                       redirectToLoginOn401 = true,
                                       errorPageOn500 = true,
                                       signal = null
                                   }: MakeRequestOptions<BodyType> = {}) {
    // First, make sure the URL starts with a slash
    if (!url.startsWith('/')) {
        url = '/' + url;
    }

    // If the useBaseAPIURL is true, then add the base URL to the request
    if (useBaseAPIURL) {
        url = BASE_API_URL + url;
    }

    // If there are query parameters, add them to the URL
    if (queryParams) {
        url += "?";
        for (const param of queryParams) {
            url += `${param.key}=${param.value}&`;
        }

        // Remove last "&" from the URL
        url = url.slice(0, -1);
    }

    // Next, make the actual request
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-Portalseguranca-Force': force
        },
        body: method === "GET" || body === null ? undefined: JSON.stringify(body),
        signal: signal ? signal : null,
    });

    // If the response status is 401, redirect to the login page
    if (response.status === 401 && redirectToLoginOn401) {
        window.location.reload(); // Since the whole app is in Private Route, by reloading the page, it'll force Private Route to get the validity of the token again
        return new Response(); // Don't be mad, TS
    }

    // After that, get the code from the response, if it is higher than 500, assume something went wrong and try to reload the current page
    if (response.status >= 500 && errorPageOn500) {
        // Trying to get the JSON from the response
        try {
            const json: RequestError = await response.json();
            location.pathname = `${BASE_URL}/erro${json.code ? `?code=${json.code}` : ""}`;
        } catch (_) {
            location.pathname = `${BASE_URL}/erro`;
        }

    }

    // Finally, return the response
    return response;
}