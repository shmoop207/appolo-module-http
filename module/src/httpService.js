"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const responseError_1 = require("./responseError");
const url_1 = require("url");
let HttpService = class HttpService {
    request(options) {
        let dto = Object.assign(Object.assign({}, options), { retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry, retryDelay: options.retryDelay || this.moduleOptions.retryDelay, currentRetryAttempt: 0, fallbackUrlIndex: 0 });
        if (options.baseURL) {
            dto.url = new url_1.URL(options.url, options.baseURL).toString();
            if (options.fallbackUrls) {
                dto.fallbackUrls = options.fallbackUrls.map(baseURL => new url_1.URL(options.url, baseURL).toString());
            }
            delete dto.baseURL;
        }
        return this._request(dto);
    }
    async _request(options) {
        try {
            let result = await this.httpProvider.request(options);
            return result;
        }
        catch (e) {
            let err = e, config = err.config;
            if (options.retryStatus && err.response && options.retryStatus < err.response.status) {
                throw new responseError_1.ResponseError(err);
            }
            if (config.fallbackUrls && config.fallbackUrls.length && options.fallbackUrlIndex < config.fallbackUrls.length) {
                let url = config.fallbackUrls[options.fallbackUrlIndex];
                options.url = url;
                options.fallbackUrlIndex++;
                return this._request(options);
            }
            else {
                options.fallbackUrlIndex = 0;
            }
            if (config.retry > 0 && options.currentRetryAttempt < config.retry) {
                options.currentRetryAttempt++;
                let backoff = config.retryDelay * options.currentRetryAttempt;
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this._request(options);
            }
            throw new responseError_1.ResponseError(err);
        }
    }
    requestAndForget(options) {
        this.request(options).catch(() => {
        });
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], HttpService.prototype, "httpProvider", void 0);
tslib_1.__decorate([
    appolo_1.inject()
], HttpService.prototype, "moduleOptions", void 0);
HttpService = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton()
], HttpService);
exports.HttpService = HttpService;
//# sourceMappingURL=httpService.js.map