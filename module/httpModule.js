"use strict";
var HttpModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpModule = void 0;
const tslib_1 = require("tslib");
const engine_1 = require("@appolo/engine");
const index_1 = require("../index");
const defaults_1 = require("./src/defaults");
let HttpModule = HttpModule_1 = class HttpModule extends engine_1.Module {
    constructor() {
        super(...arguments);
        this.Defaults = defaults_1.Defaults;
    }
    static for(options) {
        return { type: HttpModule_1, options };
    }
    get exports() {
        return [{ id: this.moduleOptions.id, type: index_1.HttpService }];
    }
};
HttpModule = HttpModule_1 = tslib_1.__decorate([
    (0, engine_1.module)()
], HttpModule);
exports.HttpModule = HttpModule;
//# sourceMappingURL=httpModule.js.map