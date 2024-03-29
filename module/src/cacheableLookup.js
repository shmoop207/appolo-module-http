"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheableLookup = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const appolo_cache_1 = require("appolo-cache");
const dns = require("dns/promises");
const node_dns_1 = require("node:dns");
const os = require("node:os");
const utils_1 = require("@appolo/utils");
let CacheableLookup = class CacheableLookup {
    constructor() {
        this._pendding = new Map();
        this._defaults = {
            cacheTtl: 1000 * 60,
            cacheErrorTtl: 1000 * 5,
            lookUpRetries: 3,
            lookUpTimeout: 5 * 1000,
            maxItems: 100000
        };
    }
    init() {
        this._defaults = Object.assign(this._defaults, this.moduleOptions.dnsCacheOptions || {});
        this._resolver = new dns.Resolver({ timeout: this._defaults.lookUpTimeout, tries: this._defaults.lookUpRetries });
        this._cache = new appolo_cache_1.Cache({ maxSize: this._defaults.maxItems, maxAge: this._defaults.cacheTtl });
        this._iface = this._getIfaceInfo();
    }
    lookup(hostname, options, callback) {
        options = options || {};
        let key = `${hostname}`;
        let params = { hostname, options, key };
        let cacheResult = this._cache.getByExpire(params.key);
        if (!cacheResult) {
            this._lookupAsync(params)
                .then(entries => this._prepareAddresses(params, entries, callback))
                .catch(e => this._prepareAddresses(params, [], callback, e));
            return;
        }
        if (!cacheResult.validExpire) {
            this._lookupAsync(params)
                .catch(e => null);
        }
        this._prepareAddresses(params, cacheResult.value, callback);
    }
    _lookupAsync(params) {
        if (this._pendding.has(params.key)) {
            return this._pendding.get(params.key);
        }
        let promise = this._resolveOrLookup(params);
        this._pendding.set(params.key, promise);
        return promise;
    }
    async _resolveOrLookup(params) {
        try {
            let result = await this._resolve(params);
            if (result.entries.length === 0) {
                result = await this._lookup(params);
            }
            const cacheTtl = result.entries.length === 0 ? this._defaults.cacheErrorTtl : result.ttl;
            this._cache.set(params.key, result.entries, cacheTtl);
            return result.entries;
        }
        finally {
            this._pendding.delete(params.key);
        }
    }
    _prepareAddresses(params, addresses, callback, e) {
        let { options, hostname } = params;
        if (e) {
            this._callCallback(callback, this.createError({ hostname: hostname, code: e.code }), [], options.all);
            return;
        }
        if (options.family === 6) {
            const filtered = addresses.filter(entry => entry.family === 6);
            if (options.hints & node_dns_1.V4MAPPED) {
                if ((typeof node_dns_1.ALL === 'number' && options.hints & node_dns_1.ALL) || filtered.length === 0) {
                    addresses = addresses.map(entry => entry.family === 6 ? entry : {
                        address: `::ffff:${entry.address}`,
                        family: 6
                    });
                }
                else {
                    addresses = filtered;
                }
            }
            else {
                addresses = filtered;
            }
        }
        else if (options.family === 4) {
            addresses = addresses.filter(entry => entry.family === 4);
        }
        if (options.hints & node_dns_1.ADDRCONFIG) {
            addresses = addresses.filter(entry => entry.family === 6 ? this._iface.has6 : this._iface.has4);
        }
        if (addresses.length === 0) {
            this._callCallback(callback, this.createError({ hostname: hostname, code: "ENOTFOUND" }), [], options.all);
            return;
        }
        this._callCallback(callback, null, addresses, options.all);
    }
    _callCallback(callback, error, addresses, all) {
        if (all) {
            callback(error, addresses);
        }
        else {
            let address = addresses.length ? utils_1.Arrays.random(addresses) : { address: "", family: 4 };
            callback(error, address, address.family);
        }
    }
    createError(params) {
        let code = params.code || "ENOTFOUND";
        const error = new Error(`cacheableLookup ${code} ${params.hostname}`);
        error.code = code;
        error.hostname = params.hostname;
        return error;
    }
    async _lookup(params) {
        let promises = [];
        if (!params.options.family || params.options.family == 4) {
            promises.push(dns.lookup(params.hostname, { all: true, family: 4 })
                .then(addresses => this._convertToLookupAddressEntry(addresses, 4))
                .catch(e => this._handleError(e)));
        }
        if (!params.options.family || params.options.family == 6) {
            promises.push(dns.lookup(params.hostname, { all: true, family: 6 })
                .then(addresses => this._convertToLookupAddressEntry(addresses, 6))
                .catch(e => this._handleError(e)));
        }
        const results = await Promise.all(promises);
        let entries = [];
        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            entries.push(...result.entries);
        }
        return { entries, ttl: this._defaults.cacheTtl };
    }
    async _resolve(params) {
        let promises = [];
        if (!params.options.family || params.options.family == 4) {
            promises.push(this._resolver.resolve4(params.hostname, { ttl: true })
                .then(addresses => this._convertToLookupAddressEntry(addresses, 4))
                .catch(e => this._handleError(e)));
        }
        if (!params.options.family || params.options.family == 6) {
            promises.push(this._resolver.resolve6(params.hostname, { ttl: true })
                .then(addresses => this._convertToLookupAddressEntry(addresses, 6))
                .catch(e => this._handleError(e)));
        }
        const results = await Promise.all(promises);
        let entries = [], ttl = 0;
        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            ttl = ttl ? ((result.ttl > 0) ? Math.min(result.ttl, ttl) : ttl) : result.ttl;
            entries.push(...result.entries);
        }
        return { entries, ttl: (ttl * 1000) || this._defaults.cacheTtl };
    }
    _convertToLookupAddressEntry(addresses, family) {
        let output = [], ttl = 0;
        for (let i = 0; i < addresses.length; i++) {
            let entry = addresses[i];
            if (!entry.address || typeof entry.address !== "string") {
                continue;
            }
            let record = { family: family, address: entry.address };
            output.push(record);
            ttl = Math.max(ttl, entry.ttl || 0);
        }
        return { entries: output, ttl: ttl };
    }
    _handleError(error) {
        if (error.code === 'ENODATA' || error.code === 'ENOTFOUND' || error.code === 'ENOENT') {
            return { entries: [], ttl: 0 };
        }
        throw error;
    }
    _getIfaceInfo() {
        let has4 = false;
        let has6 = false;
        for (const device of Object.values(os.networkInterfaces())) {
            for (const iface of device) {
                if (iface.internal) {
                    continue;
                }
                (iface.family === 'IPv6') ? has6 = true : has4 = true;
                if (has4 && has6) {
                    break;
                }
            }
        }
        return { has4, has6 };
    }
};
tslib_1.__decorate([
    (0, inject_1.inject)()
], CacheableLookup.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    (0, inject_1.init)()
], CacheableLookup.prototype, "init", null);
CacheableLookup = tslib_1.__decorate([
    (0, inject_1.define)(),
    (0, inject_1.singleton)()
], CacheableLookup);
exports.CacheableLookup = CacheableLookup;
//# sourceMappingURL=cacheableLookup.js.map