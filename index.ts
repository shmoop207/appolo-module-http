"use strict";
import {HttpModule} from "./module/httpModule";
import {HttpService} from "./module/src/httpService";
import {ResponseError} from "./module/src/responseError";
import {IConfig, IOptions, IHttpResponse, Method} from "./module/src/IOptions";

export {HttpModule, HttpService, IOptions, ResponseError, IConfig, IHttpResponse, Method}

declare module 'axios' {
    interface AxiosRequestConfig {
        retry?: number;
        retryDelay?: number;
        fallbackUrls?: string[];
    }
}
