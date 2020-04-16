"use strict";
var HttpModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("appolo/index");
const index_2 = require("../index");
const defaults_1 = require("./src/defaults");
let HttpModule = HttpModule_1 = class HttpModule extends index_1.Module {
    constructor(opts) {
        super(opts);
        this.Defaults = defaults_1.Defaults;
    }
    static for(opts) {
        return new HttpModule_1(opts);
    }
    get exports() {
        return [{ id: this.moduleOptions.id, type: index_2.HttpService }];
    }
};
HttpModule = HttpModule_1 = tslib_1.__decorate([
    index_1.module()
], HttpModule);
exports.HttpModule = HttpModule;
//# sourceMappingURL=httpModule.js.map