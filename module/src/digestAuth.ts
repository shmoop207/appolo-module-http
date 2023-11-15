import {IConfigInner} from "./IOptions";
import * as crypto from "crypto";

let _count: number = 0;

export function createDigestAuth(options: IConfigInner, authHeader: string): string {
    const authDetails = authHeader.split(',').map((v: string) => v.split('='));
    ++_count;
    const nonceCount = ('00000000' + _count).slice(-8);
    const cnonce = crypto.randomBytes(24).toString('hex');
    const realm = authDetails.find((el: any) => el[0].toLowerCase().indexOf("realm") > -1)[1].replace(/"/g, '');
    const nonce = authDetails.find((el: any) => el[0].toLowerCase().indexOf("nonce") > -1)[1].replace(/"/g, '');
    const ha1 = crypto.createHash('md5').update(`${options.authDigest.username}:${realm}:${options.authDigest.password}`).digest('hex');
    const url = new URL(options.url);
    const ha2 = crypto.createHash('md5').update(`${options.method ?? 'GET'}:${url.pathname}`).digest('hex');
    const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nonceCount}:${cnonce}:auth:${ha2}`).digest('hex');
    const authorization = `Digest username="${options.authDigest.username}",realm="${realm}",` +
        `nonce="${nonce}",uri="${url.pathname}",qop="auth",algorithm="MD5",` +
        `response="${response}",nc="${nonceCount}",cnonce="${cnonce}"`;
    return authorization;
}