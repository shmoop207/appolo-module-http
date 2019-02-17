"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const axios_1 = require("axios");
const rax = require("retry-axios");
let HttpRetryProvider = class HttpRetryProvider {
    get() {
        let instance = axios_1.default.create(Object.assign({}, this.moduleOptions));
        instance.defaults = {
            raxConfig: {
                instance: instance,
            }
        };
        rax.attach(instance);
        return instance;
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], HttpRetryProvider.prototype, "moduleOptions", void 0);
HttpRetryProvider = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton(),
    appolo_1.factory()
], HttpRetryProvider);
exports.HttpRetryProvider = HttpRetryProvider;
//# sourceMappingURL=httpRetryProvider.js.map