"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsCache = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const appolo_cache_1 = require("appolo-cache");
const net = require("net");
const dns = require("dns/promises");
const utils_1 = require("@appolo/utils");
let DnsCache = class DnsCache {
    constructor() {
        this.DefaultTtl = 1000 * 60 * 5;
    }
    async replaceHostName(config) {
        if (!this._cache) {
            this._cache = new appolo_cache_1.Cache({ maxSize: 10000, maxAge: config.dnsCacheTtl || this.DefaultTtl });
        }
        let urlObj = new URL(config.url);
        if (net.isIP(urlObj.hostname)) {
            return;
        }
        config.headers.Host = urlObj.hostname;
        let ips = await this._getHostNameIps(urlObj.hostname);
        urlObj.hostname = utils_1.Arrays.random(ips);
        config.url = urlObj.toString();
    }
    async _getHostNameIps(hostname) {
        let cacheResult = this._cache.getByExpire(hostname);
        if (!cacheResult) {
            return await this._refreshHostNameIps(hostname);
        }
        if (!cacheResult.validExpire) {
            this._refreshHostNameIps(hostname);
        }
        return cacheResult.value;
    }
    async _refreshHostNameIps(hostname) {
        let ips = await this._resolveOrLookup(hostname);
        this._cache.set(hostname, ips);
        return ips;
    }
    async _resolveOrLookup(hostname) {
        let [errResolve, ips] = await utils_1.Promises.to(dns.resolve(hostname));
        if (ips && ips.length) {
            return ips;
        }
        let [errLookup, lookups] = await utils_1.Promises.to(dns.lookup(hostname, { all: true }));
        if (lookups && lookups.length) {
            return lookups.filter(r => !!r.address).map(r => r.address);
        }
        return [hostname];
    }
};
DnsCache = tslib_1.__decorate([
    (0, inject_1.define)(),
    (0, inject_1.singleton)()
], DnsCache);
exports.DnsCache = DnsCache;
//# sourceMappingURL=dnsCache.js.map