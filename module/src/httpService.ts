import {define, inject, singleton} from 'appolo';
import {AxiosInstance, AxiosRequestConfig, AxiosError} from 'axios'
import {IConfig, IOptions, IHttpResponse} from "./IOptions";
import {ResponseError} from "./responseError";


@define()
@singleton()
export class HttpService {

    @inject() private httpProvider: AxiosInstance;
    @inject() private moduleOptions: IOptions;

    public async request<T>(options: IConfig): Promise<IHttpResponse<T>> {

        let dto: IConfig = {
            ...options,
            currentRetryAttempt: options.currentRetryAttempt || 0,
            retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry,
            retryDelay: options.retryDelay || this.moduleOptions.retryDelay,
        };

        try {
            let result = await this.httpProvider.request<T>(dto);

            return result;

        } catch (e) {
            let err: AxiosError = e, config = err.config;

            if (config.retry > 0 && config.currentRetryAttempt < config.retry) {

                config.currentRetryAttempt++;

                let backoff = config.retryDelay * config.currentRetryAttempt;

                await new Promise(resolve => setTimeout(resolve, backoff))

                return this.request(config);
            }

            if (config.fallbackUrls && config.fallbackUrls.length) {
                let url = config.fallbackUrls.shift();

                config.url = url;

                return this.request(config);
            }

            throw new ResponseError(err.message,err.config,err.code,err.request,err.response);
        }

    }

    public requestAndForget<T>(options: IConfig): void {
        this.request(options).catch(() => {
        })
    }
}


