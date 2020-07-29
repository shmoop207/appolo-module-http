import {IConfig, IHttpResponse} from "./IOptions";
import {ClientRequest} from "http";

export class ResponseError extends Error {

    constructor(message: string, private _config: IConfig,
                private _code: string,
                private _request: ClientRequest,
                private _response: IHttpResponse) {

        super(message);

        this.name = "ResponseError";

        Object.setPrototypeOf(this,  new.target.prototype);
    }

    public get code(): string {
        return this._code;
    }

    public get config(): IConfig {
        return this._config;
    }

    public get response(): IHttpResponse {
        return this._response;
    }

    public get request(): ClientRequest {
        return this._request;
    }

    public get statusCode(): number {
        return this._response ? this._response.status : 0;
    }
}
