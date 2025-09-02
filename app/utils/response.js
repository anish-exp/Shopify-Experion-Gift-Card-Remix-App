export function createResponseHelpers(storeDomain) {
    const defaultHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": storeDomain ?? "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    };

    return {
        jsonResponse: (status, data, headers = {}) => {
            return new Response(JSON.stringify(data), {
                status,
                headers: { ...defaultHeaders, ...headers },
            });
        },

        errorResponse: (error, status = 500, headers = {}) => {
            return new Response(JSON.stringify({
                success: false,
                error: error.message || "An unknown error occurred",
                ...(error.details && { details: error.details }),
            }), {
                status,
                headers: { ...defaultHeaders, ...headers },
            });
        }
    };
}

// export function jsonResponse(status, data, headers = {}) {
//     const defaultHeaders = {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": storeDomain || "*",
//         "Access-Control-Allow-Headers": "Content-Type, Authorization",
//         "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Allowed methods
//     };
//     return new Response(JSON.stringify(data), {
//         status,
//         headers: { ...defaultHeaders, ...headers },
//     });
// }


// export function errorResponse(error, status = 500, headers = {}) {
//     return jsonResponse(status, {
//         success: false,
//         error: error.message || "An unknown error occurred",
//         ...(error.details && { details: error.details }),
//     }, { ...headers, "Access-Control-Allow-Origin": storeDomain || "*", });
// }