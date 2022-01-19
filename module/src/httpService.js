"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const responseError_1 = require("./responseError");
const utils_1 = require("@appolo/utils");
const util_1 = require("./util");
let HttpService = class HttpService {
    request(options) {
        let dto = Object.assign(Object.assign({}, options), { retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry, retryDelay: options.retryDelay || this.moduleOptions.retryDelay, currentRetryAttempt: 0, fallbackUrlIndex: 0, hardTimeoutInterval: null });
        if (options.baseURL) {
            dto.url = util_1.Util.combineURLs(options.baseURL, options.url);
            if (options.fallbackUrls) {
                dto.fallbackUrls = options.fallbackUrls.map(baseURL => util_1.Util.combineURLs(baseURL, options.url));
            }
            delete dto.baseURL;
        }
        return this._request(dto);
    }
    async _request(options) {
        try {
            let promise = this.httpProvider.request(options);
            let result = await (options.hardTimeout ? utils_1.Promises.promiseTimeout(promise, options.hardTimeout) : promise);
            return result;
        }
        catch (e) {
            let err = e;
            if (e.message == "promise timeout") {
                e.message = `timeout of ${options.hardTimeout}ms exceeded`;
            }
            if (options.retryStatus && err.response && err.response.status < options.retryStatus) {
                throw new responseError_1.ResponseError(err, options);
            }
            if (options.fallbackUrls && options.fallbackUrls.length && options.fallbackUrlIndex < options.fallbackUrls.length) {
                let url = options.fallbackUrls[options.fallbackUrlIndex];
                options.url = url;
                options.fallbackUrlIndex++;
                return this._request(options);
            }
            else {
                options.fallbackUrlIndex = 0;
            }
            if (options.retry > 0 && options.currentRetryAttempt < options.retry) {
                options.currentRetryAttempt++;
                let backoff = options.retryDelay * options.currentRetryAttempt;
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this._request(options);
            }
            throw new responseError_1.ResponseError(err, options);
        }
    }
    requestAndForget(options) {
        this.request(options).catch(() => {
        });
    }
};
(0, tslib_1.__decorate)([
    (0, inject_1.inject)()
], HttpService.prototype, "httpProvider", void 0);
(0, tslib_1.__decorate)([
    (0, inject_1.inject)()
], HttpService.prototype, "moduleOptions", void 0);
HttpService = (0, tslib_1.__decorate)([
    (0, inject_1.define)(),
    (0, inject_1.singleton)()
], HttpService);
exports.HttpService = HttpService;
//# sourceMappingURL=httpService.js.map