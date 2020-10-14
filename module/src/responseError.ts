import {IConfig, IHttpResponse} from "./IOptions";
import {ClientRequest} from "http";
import {AxiosError} from "axios";

export class ResponseError extends Error {

    private readonly _code: string;
    private readonly _config: IConfig;
    private readonly _response: IHttpResponse;
    private readonly _request: ClientRequest;

    constructor(err: AxiosError,config:IConfig) {

        super(err.message);

        this._code = err.code;
        this._config = err.config || config;
        this._response = err.response;
        this._request = err.request;

        this.name = "ResponseError";

        Object.setPrototypeOf(this, new.target.prototype);
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
