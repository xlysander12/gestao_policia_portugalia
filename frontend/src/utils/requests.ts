// This function will handle all requests to the backend
// It will be used by all components that need to make requests
// It will be a wrapper around the fetch API, making it easier to use
import {BASE_API_URL} from "./constants";

type MakeRequestOptions = {
    body?: object,
    force?: string,
    useAuth?: boolean,
    useBaseAPIURL?: boolean,
    redirectToLoginOn401?: boolean
}
export async function make_request(url: string, method: ("GET" | "POST" | "PATCH" | "PUT" | "DELETE"),
                                   {
                                       body= {},
                                       force = <string>localStorage.getItem("force"),
                                       useAuth = true,
                                       useBaseAPIURL = true,
                                       redirectToLoginOn401 = true
                                   }: MakeRequestOptions = {}) {
    // First, make sure the URL starts with a slash
    if (!url.startsWith('/')) {
        url = '/' + url;
    }

    // If the useBaseAPIURL is true, then add the base URL to the request
    if (useBaseAPIURL) {
        url = BASE_API_URL + url;
    }

    // Next, make the actual request
    let response = await fetch(url, {
        method: method,
        // @ts-ignore
        headers: {
            'Content-Type': 'application/json',
            'Authorization': useAuth ? localStorage.getItem('token') : null,
            'X-Portalseguranca-Force': force
        },
        body: method === "GET" ? undefined: JSON.stringify(body)
    });

    // If the response status is 401, redirect to the login page
    if (response.status === 401 && redirectToLoginOn401) {
        window.location.reload(); // Since the whole app is in Private Route, by reloading the page, it'll force Private Route to get the validity of the token again
        return new Response(); // Don't be mad TS
    }

    // After that, get the code from the response, if it is higher than 500, assume something went wrong and try to reload the current page
    // TODO: Add a toast with the error code
    if (response.status >= 500) {
        window.location.reload();
    }

    // Finally, return the response
    return response;
}