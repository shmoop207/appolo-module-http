"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const axios_1 = require("axios");
let HttpProvider = class HttpProvider {
    get() {
        let instance = axios_1.default.create(Object.assign({}, this.moduleOptions));
        return instance;
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], HttpProvider.prototype, "moduleOptions", void 0);
HttpProvider = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton(),
    appolo_1.factory()
], HttpProvider);
exports.HttpProvider = HttpProvider;
//# sourceMappingURL=httpProvider.js.map