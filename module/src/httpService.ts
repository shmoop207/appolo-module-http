import {define, inject, singleton} from '@appolo/inject';
import axios, {AxiosInstance, AxiosRequestConfig, AxiosError} from 'axios'
import * as crypto from "crypto";
import {IConfig, IOptions, IHttpResponse, IConfigInner} from "./IOptions";
import {ResponseError} from "./responseError";

import {Promises, Strings} from "@appolo/utils";
import {Util} from "./util";
import {gzip} from "zlib";


@define()
@singleton()
export class HttpService {

    @inject() private httpProvider: AxiosInstance;
    @inject() private moduleOptions: IOptions;
    private count: number = 0;

    public async request<T>(options: IConfig): Promise<IHttpResponse<T>> {

        let dto: IConfigInner = {
            ...options,
            retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry,
            retryDelay: options.retryDelay || this.moduleOptions.retryDelay,
            currentRetryAttempt: 0,
            fallbackUrlIndex: 0,
            headers: options.headers || {}
        };

        await this._handleGzip(dto);

        if (options.baseURL) {

            dto.url = Util.combineURLs(options.baseURL, options.url)

            if (options.fallbackUrls) {
                dto.fallbackUrls = options.fallbackUrls.map(baseURL => Util.combineURLs(baseURL, options.url))
            }

            delete dto.baseURL;
        }

        return this._request<T>(dto);

    }

    private async _handleGzip(options: IConfigInner) {
        if (!options.compressGzip) {
            return;
        }

        let data: string;

        if (Strings.isString(options.data) || Buffer.isBuffer(options.data)) {
            data = options.data as string;
        } else {
            data = JSON.stringify(options.data);
            options.headers['content-type'] = 'application/json';
        }

        if (data.length < (options.compressGzipMinSize || 1024)) {
            return;
        }

        options.headers['Content-Encoding'] = 'gzip';


        options.data = await Promises.fromCallback(c => gzip(data, c));
    }

    private async _request<T>(options: IConfigInner): Promise<IHttpResponse<T>> {
        try {
            let promise = this.httpProvider.request<T>(options);

            let result = await (options.hardTimeout ? Promises.promiseTimeout(promise, options.hardTimeout) : promise);


            return result as any

        } catch (e) {
            let err: AxiosError = e;

            if (options.authDigest && !options.didCheckAuth && err.response && err.response.status == 401 && err.response.headers['www-authenticate']?.includes("nonce")) {
                options.didCheckAuth = true;
                const authorization = this._handleDigestAuth(options, err.response.headers['www-authenticate']);
                if (options.headers) {
                    options.headers['authorization'] = authorization;
                } else {
                    options.headers = {authorization: authorization};
                }
                return this._request(options);
            }

            if (e.message == "promise timeout") {
                e.message = `timeout of ${options.hardTimeout}ms exceeded`;
            }

            if (options.retryStatus && err.response && err.response.status < options.retryStatus) {
                throw new ResponseError(err, options);
            }

            if (options.fallbackUrls && options.fallbackUrls.length && options.fallbackUrlIndex < options.fallbackUrls.length) {
                let url = options.fallbackUrls[options.fallbackUrlIndex]

                options.url = url;
                options.fallbackUrlIndex++;

                return this._request(options);

            } else {
                options.fallbackUrlIndex = 0;
            }


            if (options.retry > 0 && options.currentRetryAttempt < options.retry) {

                options.currentRetryAttempt++;

                let backoff = options.retryDelay * options.currentRetryAttempt;

                await new Promise(resolve => setTimeout(resolve, backoff))

                return this._request(options);
            }


            throw new ResponseError(err, options);
        }

    }

    public requestAndForget<T>(options: IConfig): void {
        this.request(options).catch(() => {
        })
    }

    private _handleDigestAuth(options: IConfigInner, authHeader: string): string {
        const authDetails = authHeader.split(',').map((v: string) => v.split('='));
        ++this.count;
        const nonceCount = ('00000000' + this.count).slice(-8);
        const cnonce = crypto.randomBytes(24).toString('hex');
        const realm = authDetails.find((el: any) => el[0].toLowerCase().indexOf("realm") > -1)[1].replace(/"/g, '');
        const nonce = authDetails.find((el: any) => el[0].toLowerCase().indexOf("nonce") > -1)[1].replace(/"/g, '');
        const ha1 = crypto.createHash('md5').update(`${options.authDigest.username}:${realm}:${options.authDigest.password}`).digest('hex');
        const url = new URL(options.url);
        const ha2 = crypto.createHash('md5').update(`${options.method ?? 'GET'}:${url.pathname}`).digest('hex');
        const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nonceCount}:${cnonce}:auth:${ha2}`).digest('hex');
        const authorization = `Digest username="${options.authDigest.username}",realm="${realm}",` +
            `nonce="${nonce}",uri="${url.pathname}",qop="auth",algorithm="MD5",` +
            `response="${response}",nc="${nonceCount}",cnonce="${cnonce}"`;
        return authorization;
    }
}


