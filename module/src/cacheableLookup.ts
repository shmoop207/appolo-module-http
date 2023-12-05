import {define, factory, IFactory, inject, singleton, init} from '@appolo/inject';
import {Cache} from 'appolo-cache';
import {IConfigInner, IOptions} from "./IOptions";
import * as dns from 'dns/promises'
import {ADDRCONFIG, ALL, V4MAPPED} from "node:dns";
import * as os from "node:os";

export type AddressFamily = 4 | 6 | undefined;

export interface LookupAddressEntry {
    readonly address: string;
    readonly family: AddressFamily;
}

interface LookupResult {
    readonly entries: LookupAddressEntry[];
    readonly ttl: number
}

interface LookupOptions {

    hints?: number;

    family?: AddressFamily;

    all?: boolean;
}

interface LookupParams {

    hostname: string
    options: LookupOptions
    key: string
}

type Callback = (error: NodeJS.ErrnoException | null, address?: LookupAddressEntry | LookupAddressEntry[], family?: AddressFamily) => void

@define()
@singleton()
export class CacheableLookup {

    @inject() moduleOptions: IOptions;

    private _cache: Cache<string, LookupAddressEntry[]>

    private readonly DefaultTtl = 1000 * 60;
    private readonly DefaultErrorTtl = 1000 * 15;

    private _resolver = new dns.Resolver();
    private _iface: { has4: boolean, has6: boolean };
    private _pendding = new Map<string, Promise<LookupAddressEntry[]>>();

    @init()
    private init() {
        this._cache = new Cache({maxSize: 100000, maxAge: this.moduleOptions.dnsCacheTtl || this.DefaultTtl});

        this._iface = this._getIfaceInfo();
    }

    public lookup(hostname: string, options: LookupOptions, callback: Callback): void {

        options = options || {};

        let key = `${hostname}`;

        let params = {hostname, options, key};

        let cacheResult = this._cache.getByExpire(params.key);

        if (!cacheResult) {
            this._lookupAsync(params)
                .then(entries => this._prepareAddresses(params, entries, callback))
                .catch(e => callback(e))

            return;
        }

        if (!cacheResult.validExpire) {
            this._lookupAsync(params)
                .catch(e => null);
        }

        this._prepareAddresses(params, cacheResult.value, callback)
    }

    private _lookupAsync(params: LookupParams): Promise<LookupAddressEntry[]> {
        if (this._pendding.has(params.key)) {
            return this._pendding.get(params.key)
        }

        let promise = this._resolveOrLookup(params);
        this._pendding.set(params.key, promise);

        return promise;
    }

    private async _resolveOrLookup(params: LookupParams) {
        try {
            let result = await this._resolve(params);

            if (result.entries.length === 0) {
                result = await this._lookup(params);
            }

            const cacheTtl = result.entries.length === 0 ? this.DefaultErrorTtl : result.ttl;

            this._cache.set(params.key, result.entries, cacheTtl);

            return result.entries;
        } finally {
            this._pendding.delete(params.key)
        }
    }

    private _prepareAddresses(params: LookupParams, addresses: LookupAddressEntry[], callback: Callback) {

        let {options, hostname} = params;

        if (options.family === 6) {
            const filtered = addresses.filter(entry => entry.family === 6);

            if (options.hints & V4MAPPED) {
                if ((typeof ALL === 'number' && options.hints & ALL) || filtered.length === 0) {
                    addresses = addresses.map(entry => entry.family === 6 ? entry : {
                        address: `::ffff:${entry.address}`,
                        family: 6
                    })
                } else {
                    addresses = filtered;
                }
            } else {
                addresses = filtered;
            }
        } else if (options.family === 4) {
            addresses = addresses.filter(entry => entry.family === 4);
        }

        if (options.hints & ADDRCONFIG) {
            addresses = addresses.filter(entry => entry.family === 6 ? this._iface.has6 : this._iface.has4);
        }

        if (addresses.length === 0) {
            const error: any = new Error(`cacheableLookup ENOTFOUND ${hostname}`);
            error.code = 'ENOTFOUND';
            error.hostname = hostname;
            callback(error, []);
            return;
        }

        if (options.all) {
            callback(null, addresses)
        } else {
            let address = addresses[0];
            return callback(null, address, address.family)
        }


    }

    private async _lookup(params: LookupParams): Promise<LookupResult> {

        let promises: Promise<LookupResult>[] = [];


        if (!params.options.family || params.options.family == 4) {
            promises.push(dns.lookup(params.hostname, {all: true, family: 4})
                .then(addresses => this._convertToLookupAddressEntry(addresses, 4))
                .catch(e => this._handleError(e)));
        }

        if (!params.options.family || params.options.family == 6) {
            promises.push(dns.lookup(params.hostname, {all: true, family: 6})
                .then(addresses => this._convertToLookupAddressEntry(addresses, 6))
                .catch(e => this._handleError(e)));
        }
        const results = await Promise.all(promises);
        let entries: LookupAddressEntry[] = [];

        for (let i = 0; i < results.length; i++) {
            let result = results[i];
            entries.push(...result.entries);
        }

        return {entries, ttl: this.moduleOptions.dnsCacheTtl || this.DefaultTtl};
    }

    private async _resolve(params: LookupParams): Promise<LookupResult> {

        let promises: Promise<LookupResult>[] = [];

        if (!params.options.family || params.options.family == 4) {
            promises.push(this._resolver.resolve4(params.hostname, {ttl: true})
                .then(addresses => this._convertToLookupAddressEntry(addresses, 4))
                .catch(e => this._handleError(e)));
        }

        if (!params.options.family || params.options.family == 6) {
            promises.push(this._resolver.resolve6(params.hostname, {ttl: true})
                .then(addresses => this._convertToLookupAddressEntry(addresses, 6))
                .catch(e => this._handleError(e)));
        }
        const results = await Promise.all(promises);
        let entries: LookupAddressEntry[] = [], ttl = 0

        for (let i = 0; i < results.length; i++) {
            let result = results[i];

            ttl = ttl ? ((result.ttl > 0) ? Math.min(result.ttl, ttl) : ttl) : result.ttl;

            entries.push(...result.entries);
        }

        return {entries, ttl: ttl * 1000};
    }

    private _convertToLookupAddressEntry(addresses: { address: string; ttl?: number; }[], family: AddressFamily): {
        entries: LookupAddressEntry[],
        ttl: number
    } {

        let output: LookupAddressEntry[] = [], ttl = 0

        for (let i = 0; i < addresses.length; i++) {

            let entry = addresses[i];

            if (!entry.address || typeof entry.address !== "string") {
                continue;
            }

            let record: LookupAddressEntry = {family: family, address: entry.address};
            output.push(record);
            ttl = Math.max(ttl, entry.ttl || 0);
        }

        return {entries: output, ttl: ttl};
    }

    private _handleError(error: NodeJS.ErrnoException): LookupResult {
        if (error.code === 'ENODATA' || error.code === 'ENOTFOUND' || error.code === 'ENOENT') {
            return {entries: [], ttl: 0};
        }

        throw error;
    }

    private _getIfaceInfo(): { has4: boolean, has6: boolean } {
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

        return {has4, has6};
    }
}
