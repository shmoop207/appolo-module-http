import {define, inject, singleton} from '@appolo/inject';
import axios, {AxiosInstance, AxiosRequestConfig, AxiosError} from 'axios'
import {IConfig, IOptions, IHttpResponse} from "./IOptions";
import {ResponseError} from "./responseError";

import {Promises} from "@appolo/utils";
import {Util} from "./util";


@define()
@singleton()
export class HttpService {

    @inject() private httpProvider: AxiosInstance;
    @inject() private moduleOptions: IOptions;

    public request<T>(options: IConfig): Promise<IHttpResponse<T>> {

        let dto = {
            ...options,
            retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry,
            retryDelay: options.retryDelay || this.moduleOptions.retryDelay,
            currentRetryAttempt: 0,
            fallbackUrlIndex: 0,
            hardTimeoutInterval:null,
        };

        if (options.baseURL) {

            dto.url = Util.combineURLs(options.baseURL, options.url)

            if (options.fallbackUrls) {
                dto.fallbackUrls = options.fallbackUrls.map(baseURL => Util.combineURLs(baseURL, options.url))
            }

            delete dto.baseURL;
        }



        return this._request<T>(dto);

    }

    private async _request<T>(options: IConfig & { currentRetryAttempt?: number, fallbackUrlIndex?: number }): Promise<IHttpResponse<T>> {
        try {
            let promise =  this.httpProvider.request<T>(options);

            let result = await (options.hardTimeout ? Promises.promiseTimeout(promise,options.hardTimeout)  : promise)  ;


            return result;

        } catch (e) {
            let err: AxiosError = e;

             if(e.message =="promise timeout"){
                 e.message = `timeout of ${options.hardTimeout}ms exceeded`;
             }

            if (options.retryStatus && err.response && err.response.status < options.retryStatus) {
                throw new ResponseError(err,options);
            }

            if ( options.fallbackUrls && options.fallbackUrls.length && options.fallbackUrlIndex < options.fallbackUrls.length) {
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


            throw new ResponseError(err,options);
        }

    }

    public requestAndForget<T>(options: IConfig): void {
        this.request(options).catch(() => {
        })
    }
}


