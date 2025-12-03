function CreateErrorResponse(message, statusCode = null){
    let errorResponse = {
        error: message
    };

    if(statusCode !== null) {
        errorResponse.statusCode = statusCode;
    }

    return errorResponse;
}

module.exports = CreateErrorResponse;