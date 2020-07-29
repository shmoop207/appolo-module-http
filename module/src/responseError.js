"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResponseError extends Error {
    constructor(message, _config, _code, _request, _response) {
        super(message);
        this._config = _config;
        this._code = _code;
        this._request = _request;
        this._response = _response;
        this.name = "ResponseError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
    get code() {
        return this._code;
    }
    get config() {
        return this._config;
    }
    get response() {
        return this._response;
    }
    get request() {
        return this._request;
    }
    get statusCode() {
        return this._response ? this._response.status : 0;
    }
}
exports.ResponseError = ResponseError;
//# sourceMappingURL=responseError.js.map