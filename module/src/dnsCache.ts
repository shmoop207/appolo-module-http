import {define, factory, IFactory, inject, singleton} from '@appolo/inject';
import {Cache} from 'appolo-cache';
import * as net from "net";
import {IConfigInner} from "./IOptions";
import * as dns from 'dns/promises'
import {Promises, Arrays} from '@appolo/utils'

@define()
@singleton()
export class DnsCache {

    private _cache: Cache<string, string[]>

    private readonly DefaultTtl = 1000 * 60 * 5;

    public async replaceHostName(config: IConfigInner): Promise<void> {
        if (!this._cache) {
            this._cache = new Cache({maxSize: 10000, maxAge: config.dnsCacheTtl || this.DefaultTtl});
        }

        let urlObj = new URL(config.url);

        if (net.isIP(urlObj.hostname)) {
            return
        }

        config.headers.Host = urlObj.hostname;

        let ips = await this._getHostNameIps(urlObj.hostname);

        urlObj.hostname = Arrays.random(ips);

        config.url = urlObj.toString();
    }

    private async _getHostNameIps(hostname: string): Promise<string[]> {
        let cacheResult = this._cache.getByExpire(hostname);

        if (!cacheResult) {
            return await this._refreshHostNameIps(hostname);
        }

        if (!cacheResult.validExpire) {
            this._refreshHostNameIps(hostname);
        }

        return cacheResult.value;
    }

    private async _refreshHostNameIps(hostname: string): Promise<string[]> {
        let ips = await this._resolveOrLookup(hostname);

        this._cache.set(hostname, ips);

        return ips
    }

    private async _resolveOrLookup(hostname: string) {

        let [errResolve, ips] = await Promises.to(dns.resolve(hostname));

        if (ips && ips.length) {
            return ips
        }

        let [errLookup, lookups] = await Promises.to(dns.lookup(hostname, {all: true}));

        if (lookups && lookups.length) {
            return lookups.filter(r => !!r.address).map(r => r.address);
        }

        return [hostname];

    }

}