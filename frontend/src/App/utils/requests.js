// This function will handle all requests to the backend
// It will be used by all components that need to make requests
// It will be a wrapper around the fetch API, making it easier to use
const {base_api_url} = require("./constants");

async function make_request(url, method, body= undefined, force= undefined, useAuth= true, useBaseAPIURL= true) {
    // First, make sure the URL starts with a slash
    if (!url.startsWith('/')) {
        url = '/' + url;
    }

    // If the useBaseAPIURL is true, then add the base URL to the request
    if (useBaseAPIURL) {
        url = base_api_url + url;
    }

    // Next, make sure the method is all caps
    method = method.toUpperCase();

    // Next, make the actual request
    let response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': useAuth ? localStorage.getItem('token') : undefined,
            'X-Portalseguranca-Force': force ? force : localStorage.getItem('force')
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    // After that, get the code from the response, if it is higher than 500, assume something went wrong and try to reaload the current page
    if (response.status >= 500) {
        window.location.reload();
        return;
    }

    // Finally, return the response
    return response;
}

exports.make_request = make_request;