"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
class Util {
    static combineURLs(baseURL, relativeURL) {
        return relativeURL
            ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
            : baseURL;
    }
    ;
}
exports.Util = Util;
//# sourceMappingURL=util.js.map