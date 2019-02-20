import {IModuleOptions} from 'appolo';

export interface IOptions extends IConfig, IModuleOptions {
    id?: string;

}

export interface IConfig {
    url?: string;
    method?: "get" | "post" | "put" | "patch" | "delete" | "head" | "options";
    baseURL?: string;
    headers?: { [index: string]: any };
    params?: { [index: string]: any };
    data?: { [index: string]: any };
    timeout?: number;
    withCredentials?: boolean;
    auth?: {
        username: string;
        password: string;
    };
    responseType?: "arraybuffer" | "blob" | "document" | "json" | "text" | "stream";
    xsrfCookieName?: string;
    xsrfHeaderName?: string;
    maxContentLength?: number;
    validateStatus?: (status: number) => boolean;
    maxRedirects?: number;
    httpAgent?: any;
    httpsAgent?: any;
    retry?: number;
    retryDelay?: number;
    noResponseRetries?:number
}


export interface IHttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: IConfig;
    request?: any;
}

export interface ResponseError extends Error {
    config: IConfig;
    code?: string;
    request?: any;
    response?: IHttpResponse;
}

