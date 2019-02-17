"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
let HttpService = class HttpService {
    request(options) {
        let dto = Object.assign({}, options);
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
        return result;
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], HttpService.prototype, "httpProvider", void 0);
tslib_1.__decorate([
    appolo_1.inject()
], HttpService.prototype, "httpRetryProvider", void 0);
tslib_1.__decorate([
    appolo_1.inject()
], HttpService.prototype, "moduleOptions", void 0);
HttpService = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton()
], HttpService);
exports.HttpService = HttpService;
//# sourceMappingURL=httpService.js.map