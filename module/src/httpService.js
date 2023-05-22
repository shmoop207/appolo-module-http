"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const crypto = require("crypto");
const responseError_1 = require("./responseError");
const utils_1 = require("@appolo/utils");
const util_1 = require("./util");
const zlib_1 = require("zlib");
let HttpService = class HttpService {
    constructor() {
        this.count = 0;
    }
    async request(options) {
        let dto = Object.assign(Object.assign({}, options), { retry: options.retry !== undefined ? options.retry : this.moduleOptions.retry, retryDelay: options.retryDelay || this.moduleOptions.retryDelay, currentRetryAttempt: 0, fallbackUrlIndex: 0, headers: options.headers || {} });
        await this._handleGzip(dto);
        if (options.baseURL) {
            dto.url = util_1.Util.combineURLs(options.baseURL, options.url);
            if (options.fallbackUrls) {
                dto.fallbackUrls = options.fallbackUrls.map(baseURL => util_1.Util.combineURLs(baseURL, options.url));
            }
            delete dto.baseURL;
        }
        return this._request(dto);
    }
    async _handleGzip(options) {
        if (!options.compressGzip) {
            return;
        }
        let data;
        if (utils_1.Strings.isString(options.data) || Buffer.isBuffer(options.data)) {
            data = options.data;
        }
        else {
            data = JSON.stringify(options.data);
            options.headers['content-type'] = 'application/json';
        }
        if (data.length < (options.compressGzipMinSize || 1024)) {
            return;
        }
        options.headers['Content-Encoding'] = 'gzip';
        options.data = await utils_1.Promises.fromCallback(c => (0, zlib_1.gzip)(data, c));
    }
    async _request(options) {
        var _a;
        try {
            let promise = this.httpProvider.request(options);
            let result = await (options.hardTimeout ? utils_1.Promises.promiseTimeout(promise, options.hardTimeout) : promise);
            return result;
        }
        catch (e) {
            let err = e;
            if (options.authDigest && err.response && err.response.status == 401 && ((_a = err.response.headers['www-authenticate']) === null || _a === void 0 ? void 0 : _a.includes("nonce"))) {
                const authorization = this._handleDigestAuth(options, err.response.headers['www-authenticate']);
                if (options.headers) {
                    options.headers['authorization'] = authorization;
                }
                else {
                    options.headers = { authorization: authorization };
                }
                return this._request(options);
            }
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
    _handleDigestAuth(options, authHeader) {
        var _a;
        const authDetails = authHeader.split(',').map((v) => v.split('='));
        const nonceCount = '000000008';
        const cnonce = crypto.randomBytes(24).toString('hex');
        const realm = authDetails.find((el) => el[0].toLowerCase().indexOf("realm") > -1)[1].replace(/"/g, '');
        const nonce = authDetails.find((el) => el[0].toLowerCase().indexOf("nonce") > -1)[1].replace(/"/g, '');
        const ha1 = crypto.createHash('md5').update(`${options.authDigest.username}:${realm}:${options.authDigest.password}`).digest('hex');
        const url = new URL(options.url);
        const ha2 = crypto.createHash('md5').update(`${(_a = options.method) !== null && _a !== void 0 ? _a : 'GET'}:${url.pathname}`).digest('hex');
        const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nonceCount}:${cnonce}:auth:${ha2}`).digest('hex');
        const authorization = `Digest username="${options.authDigest.username}",realm="${realm}",` +
            `nonce="${nonce}",uri="${url.pathname}",qop="auth",algorithm="MD5",` +
            `response="${response}",nc="${nonceCount}",cnonce="${cnonce}"`;
        return authorization;
    }
};
tslib_1.__decorate([
    (0, inject_1.inject)()
], HttpService.prototype, "httpProvider", void 0);
tslib_1.__decorate([
    (0, inject_1.inject)()
], HttpService.prototype, "moduleOptions", void 0);
HttpService = tslib_1.__decorate([
    (0, inject_1.define)(),
    (0, inject_1.singleton)()
], HttpService);
exports.HttpService = HttpService;
//# sourceMappingURL=httpService.js.map