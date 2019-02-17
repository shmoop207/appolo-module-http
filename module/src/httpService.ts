import {define, inject, singleton} from 'appolo';
import {AxiosInstance, AxiosRequestConfig} from 'axios'
import {IConfig, IOptions, IResponse} from "./IOptions";
import {RetryConfig} from "retry-axios";


@define()
@singleton()
export class HttpService {

    @inject() private httpProvider: AxiosInstance;
    @inject() private httpRetryProvider: AxiosInstance;
    @inject() private moduleOptions: IOptions;

    public request<T>(options: IConfig): Promise<IResponse<T>> {

        let dto: AxiosRequestConfig & { raxConfig?: RetryConfig } = {
            ...options,
        };

        let provider = this.httpProvider;

        if (options.retry || this.moduleOptions.retry || this.moduleOptions.noResponseRetries || options.noResponseRetries) {
            provider = this.httpRetryProvider;
            dto.raxConfig = {
                retry: options.retry || this.moduleOptions.retry || undefined,
                retryDelay: options.retryDelay || this.moduleOptions.retryDelay || undefined,
                noResponseRetries: options.noResponseRetries || this.moduleOptions.noResponseRetries || undefined,
                instance: provider
            };
        }

        let result = provider.request(dto);

        return result as Promise<IResponse<T>>;

    }
}


