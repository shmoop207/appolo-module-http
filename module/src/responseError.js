"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResponseError extends Error {
    constructor(err, config) {
        super(err.message);
        this._code = err.code;
        this._config = err.config || config;
        this._response = err.response;
        this._request = err.request;
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