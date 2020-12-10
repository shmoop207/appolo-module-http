"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpProvider = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const axios_1 = require("axios");
let HttpProvider = class HttpProvider {
    get() {
        let instance = axios_1.default.create(Object.assign({}, this.moduleOptions));
        return instance;
    }
};
tslib_1.__decorate([
    inject_1.inject()
], HttpProvider.prototype, "moduleOptions", void 0);
HttpProvider = tslib_1.__decorate([
    inject_1.define(),
    inject_1.singleton(),
    inject_1.factory()
], HttpProvider);
exports.HttpProvider = HttpProvider;
//# sourceMappingURL=httpProvider.js.map