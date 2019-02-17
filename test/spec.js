"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appolo_1 = require("appolo");
const __1 = require("../");
let should = require('chai').should();
describe("socket module Spec", function () {
    let app;
    beforeEach(async () => {
        app = appolo_1.createApp({ root: __dirname, environment: "production", port: 8182 });
        await app.module(new __1.HttpModule({
            retry: 2, retryDelay: 100, noResponseRetries: 2
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
                method: "get",
                url: "https://jsonplaceholder.typicode.com/todo2s/1"
            });
        }
        catch (e) {
            e.response.status.should.be.eq(404);
        }
    });
    it('should throw error with retry', async () => {
        let httpService = app.injector.get(__1.HttpService);
        try {
            let result = await httpService.request({
                method: "get",
                url: "https://jsonplaceholder2.typicode.com/todos/1"
            });
        }
        catch (e) {
            e.config.raxConfig.currentRetryAttempt.should.be.eq(2);
        }
    });
});
//# sourceMappingURL=spec.js.map