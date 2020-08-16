import {define, inject, singleton} from 'appolo';
import {AxiosInstance, AxiosRequestConfig, AxiosError} from 'axios'
import {IConfig, IOptions, IHttpResponse} from "./IOptions";
import {ResponseError} from "./responseError";
import {URL} from "url";


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
            fallbackUrlIndex: 0
        };

        if (options.baseURL) {
            dto.url = new URL( options.url,options.baseURL).toString();
            if (options.fallbackUrls) {
                dto.fallbackUrls = options.fallbackUrls.map(baseURL =>new URL( options.url,baseURL).toString())
            }

            delete dto.baseURL;
        }

        return this._request<T>(dto);

    }

    private async _request<T>(options: IConfig & { currentRetryAttempt?: number, fallbackUrlIndex?: number }): Promise<IHttpResponse<T>> {
        try {
            let result = await this.httpProvider.request<T>(options);

            return result;

        } catch (e) {
            let err: AxiosError = e, config = err.config;

            if (options.retryStatus && err.response && options.retryStatus < err.response.status) {
                throw new ResponseError(err);
            }

            if (config.fallbackUrls && config.fallbackUrls.length && options.fallbackUrlIndex < config.fallbackUrls.length) {
                let url = config.fallbackUrls[options.fallbackUrlIndex]

                options.url = url;
                options.fallbackUrlIndex++;

                return this._request(options);

            } else {
                options.fallbackUrlIndex = 0;
            }


            if (config.retry > 0 && options.currentRetryAttempt < config.retry) {

                options.currentRetryAttempt++;

                let backoff = config.retryDelay * options.currentRetryAttempt;

                await new Promise(resolve => setTimeout(resolve, backoff))

                return this._request(options);
            }


            throw new ResponseError(err);
        }
    }

    public requestAndForget<T>(options: IConfig): void {
        this.request(options).catch(() => {
        })
    }
}


