import {AddressFamily, CancelToken, GenericAbortSignal, LookupAddress, LookupAddressEntry} from "axios";

export interface IOptions extends IConfig {
    id?: string;

}

export type Method =
    | 'get' | 'GET'
    | 'delete' | 'DELETE'
    | 'head' | 'HEAD'
    | 'options' | 'OPTIONS'
    | 'post' | 'POST'
    | 'put' | 'PUT'
    | 'patch' | 'PATCH'
    | 'link' | 'LINK'
    | 'unlink' | 'UNLINK'
    | 'purge' | 'PURGE'

export interface IConfig {
    url?: string;
    useDnsCache?: boolean;
    dnsCacheTtl?: number;
    method?: Method | string;
    baseURL?: string;
    headers?: { [index: string]: any };
    params?: { [index: string]: any };
    data?: { [index: string]: any } | string | Buffer;
    timeout?: number;
    hardTimeout?: number;
    withCredentials?: boolean;
    auth?: {
        username: string;
        password: string;
    };
    authDigest?: {
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
    fallbackUrls?: string[];
    retryStatus?: number
    cancelToken?: CancelToken;
    signal?: GenericAbortSignal;
    decompress?: boolean
    compressGzip?: boolean
    compressGzipMinSize?: number,
    family?: 4 | 6 | undefined
    lookup?: ((hostname: string, options: object, cb: (err: Error | null, address: LookupAddress | LookupAddress[], family?: AddressFamily) => void) => void) |
        ((hostname: string, options: object) => Promise<[address: LookupAddressEntry | LookupAddressEntry[], family?: AddressFamily] | LookupAddress>);

}

export interface IHttpResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: IConfig;
    request?: any;
}

export interface IConfigInner extends IConfig {
    currentRetryAttempt?: number,
    fallbackUrlIndex?: number,
    didCheckAuth?: boolean,
}

