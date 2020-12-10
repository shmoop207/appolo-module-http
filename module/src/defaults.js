"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Defaults = void 0;
exports.Defaults = {
    id: "httpService",
    validateStatus: function (status) {
        return status >= 200 && status < 400;
    },
    retryDelay: 100
};
//# sourceMappingURL=defaults.js.map