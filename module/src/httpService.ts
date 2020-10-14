import {define, inject, singleton} from 'appolo';
import axios, {AxiosInstance, AxiosRequestConfig, AxiosError} from 'axios'
import {IConfig, IOptions, IHttpResponse} from "./IOptions";
import {ResponseError} from "./responseError";
import {URL} from "url";
import {Util} from "./util";
import Timer = NodeJS.Timer;


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

    private async _request<T>(options: IConfig & {hardTimeoutInterval?:Timer, currentRetryAttempt?: number, fallbackUrlIndex?: number }): Promise<IHttpResponse<T>> {
        try {

            if (options.hardTimeout) {
                let cancelSource = axios.CancelToken.source();

                options.cancelToken = cancelSource.token;

                options.hardTimeoutInterval = setTimeout(() => {
                    cancelSource.cancel(`timeout of ${options.hardTimeout}ms exceeded`)
                }, options.hardTimeout);
            }

            let result = await this.httpProvider.request<T>(options);

            if(options.hardTimeoutInterval){
                clearTimeout(options.hardTimeoutInterval);
            }


            return result;

        } catch (e) {
            let err: AxiosError = e;

            if(options.hardTimeoutInterval){
                clearTimeout(options.hardTimeoutInterval);
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


