import {define, inject, singleton} from 'appolo';
import {AxiosInstance, AxiosRequestConfig, AxiosError} from 'axios'
import {IConfig, IOptions, IHttpResponse} from "./IOptions";
import {ResponseError} from "./responseError";


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

        return this._request<T>(dto);

    }

    private async _request<T>(options: IConfig & { currentRetryAttempt?: number, fallbackUrlIndex?: number }): Promise<IHttpResponse<T>> {
        try {
            let result = await this.httpProvider.request<T>(options);

            return result;

        } catch (e) {
            let err: AxiosError = e, config = err.config;


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


            throw new ResponseError(err.message, err.config, err.code, err.request, err.response);
        }
    }

    public requestAndForget<T>(options: IConfig): void {
        this.request(options).catch(() => {
        })
    }
}


