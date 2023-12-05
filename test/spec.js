"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("@appolo/engine");
const __1 = require("../");
const sinonChai = require("sinon-chai");
const chai = require("chai");
const sinon = require("sinon");
const cacheableLookup_1 = require("../module/src/cacheableLookup");
let should = require('chai').should();
chai.use(sinonChai);
describe("socket module Spec", function () {
    let app;
    beforeEach(async () => {
        app = (0, engine_1.createApp)({ root: __dirname, environment: "production" });
        app.module.use(__1.HttpModule.for({
            retry: 2, retryDelay: 100,
        }));
        await app.launch();
    });
    afterEach(async () => {
        await app.reset();
    });
    it('should get json', async () => {
        let httpService = app.injector.get(__1.HttpService);
        let result = await httpService.request({
            method: "get",
            url: "https://jsonplaceholder.typicode.com/todos/1"
        });
        result.status.should.be.eq(200);
        result.data.id.should.be.eq(1);
    });
    it('should throw error', async () => {
        let httpService = app.injector.get(__1.HttpService);
        try {
            let result = await httpService.request({
                method: "get", timeout: 1000,
                retry: 0,
                url: "http://google.com/aaaa"
            });
            result.status.should.not.be.eq(200);
        }
        catch (e) {
            e.response.status.should.be.eq(404);
            e.config.currentRetryAttempt.should.be.eq(0);
        }
    });
    it('should throw error with retry', async () => {
        let httpService = app.injector.get(__1.HttpService);
        try {
            let result = await httpService.request({
                method: "get", retry: 2, timeout: 500,
                url: "http://google.com/aaaa"
            });
            result.status.should.not.be.eq(200);
        }
        catch (e) {
            e.config.currentRetryAttempt.should.be.eq(2);
        }
    });
    it('should get with fallback', async () => {
        let httpService = app.injector.get(__1.HttpService);
        let result = await httpService.request({
            method: "get",
            url: "http://google.com/aaaa",
            fallbackUrls: ["http://google.com"],
        });
        result.status.should.be.eq(200);
    });
    it('should throw with fallback', async () => {
        try {
            let httpService = app.injector.get(__1.HttpService);
            let result = await httpService.request({
                method: "get", retry: 0,
                url: "http://google.com/aaaa",
                fallbackUrls: ["http://google.com/bbbb"],
            });
            result.status.should.not.be.eq(200);
        }
        catch (e) {
            e.response.status.should.be.eq(404);
            e.config.url.should.be.eq("http://google.com/bbbb");
            e.statusCode.should.be.eq(404);
        }
    });
    it('should throw with hard timeout ', async () => {
        try {
            let httpService = app.injector.get(__1.HttpService);
            let result = await httpService.request({
                method: "get",
                hardTimeout: 1,
                url: "http://google.com",
            });
            result.status.should.not.be.eq(200);
        }
        catch (e) {
            e.message.should.be.eq("timeout of 1ms exceeded");
            e.config.url.should.be.eq("http://google.com");
            e.statusCode.should.be.eq(0);
        }
    });
    it('should get gzip ', async () => {
        try {
            let httpService = app.injector.get(__1.HttpService);
            let result = await httpService.request({
                method: "post",
                compressGzip: true,
                compressGzipMinSize: 1,
                url: "http://google.com",
                data: {
                    "test": { "test": 1 }
                }
            });
            result.status.should.be.eq(200);
        }
        catch (e) {
            e.config.headers["Content-Type"].should.be.eq("application/json");
            e.config.headers["Content-Encoding"].should.be.eq("gzip");
            e.config.headers["Content-Length"].should.be.eq("33");
        }
    });
    it('should get response with digest auth', async () => {
        try {
            let httpService = app.injector.get(__1.HttpService);
            let result = await httpService.request({
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                url: "http://httpbin.org/digest-auth/auth/user/passwd/MD5",
                authDigest: {
                    username: "user",
                    password: "passwd",
                }
            });
            result.status.should.be.eq(200);
        }
        catch (e) {
            console.log(e);
        }
    });
    it('should fail on 401 with digest auth', async () => {
        try {
            let httpService = app.injector.get(__1.HttpService);
            let result = await httpService.request({
                method: "GET",
                headers: {
                    Accept: "application/json"
                },
                url: "http://httpbin.org/digest-auth/auth/user/passwd/MD5",
                authDigest: {
                    username: "user",
                    password: "not_passwd",
                }
            });
        }
        catch (e) {
            e.response.status.should.be.eq(401);
        }
    });
    it('should use dns cache', async () => {
        let httpService = app.injector.get(__1.HttpService);
        let cacheableLookup = app.module.moduleAt(0).app.injector.get(cacheableLookup_1.CacheableLookup);
        // @ts-ignore
        let spy = sinon.spy(cacheableLookup, "_lookupAsync");
        let result = await httpService.request({
            method: "get",
            useDnsCache: true, family: 4,
            url: "http://www.bing.com"
        });
        result.status.should.be.eq(200);
        spy.should.have.been.calledOnce;
        let result2 = await httpService.request({
            method: "get",
            useDnsCache: true, family: 4,
            url: "http://www.bing.com"
        });
        result2.status.should.be.eq(200);
        spy.should.have.callCount(1);
    });
    it('should use dns cache throw error', async () => {
        let httpService = app.injector.get(__1.HttpService);
        try {
            await httpService.request({
                method: "post",
                useDnsCache: true,
                url: "https://aaa.bb.cc"
            });
        }
        catch (e) {
            e.message.should.contain("ENOTFOUND");
        }
    });
});
//# sourceMappingURL=spec.js.map