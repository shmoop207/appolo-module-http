"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const responseError_1 = require("./responseError");
let HttpService = class HttpService {
    async request(options) {
        let dto = Object.assign(Object.assign({}, options), { currentRetryAttempt: options.currentRetryAttempt || 0, retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry, retryDelay: options.retryDelay || this.moduleOptions.retryDelay });
        try {
            let result = await this.httpProvider.request(dto);
            return result;
        }
        catch (e) {
            let err = e, config = err.config;
            if (config.retry > 0 && config.currentRetryAttempt < config.retry) {
                config.currentRetryAttempt++;
                let backoff = config.retryDelay * config.currentRetryAttempt;
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.request(config);
            }
            if (config.fallbackUrls && config.fallbackUrls.length) {
                let url = config.fallbackUrls.shift();
                config.url = url;
                return this.request(config);
            }
            throw new responseError_1.ResponseError(err.message, err.config, err.code, err.request, err.response);
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