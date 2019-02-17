"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("appolo/index");
const index_2 = require("../index");
const defaults_1 = require("./src/defaults");
let HttpModule = class HttpModule extends index_1.Module {
    constructor(opts) {
        super(opts);
        this.Defaults = defaults_1.Defaults;
    }
    get exports() {
        return [{ id: this.moduleOptions.id, type: index_2.HttpService }];
    }
};
HttpModule = tslib_1.__decorate([
    index_1.module()
], HttpModule);
exports.HttpModule = HttpModule;
//# sourceMappingURL=httpModule.js.map