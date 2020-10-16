import {App, createApp} from 'appolo'
import {HttpModule, HttpService, ResponseError} from '../'

let should = require('chai').should();


describe("socket module Spec", function () {

    let app: App;

    beforeEach(async () => {

        app = createApp({root: __dirname, environment: "production", port: 8182});

        await app.module(new HttpModule({

            retry: 2, retryDelay: 100,

        }));

        await app.launch();

    });

    afterEach(async () => {
        await app.reset();
    });

    it('should get json', async () => {


        let httpService = app.injector.get<HttpService>(HttpService);

        let result = await httpService.request<{ id: number }>({
            method: "get",
            url: "https://jsonplaceholder.typicode.com/todos/1"
        })

        result.status.should.be.eq(200);
        result.data.id.should.be.eq(1);

    });

    it('should throw error', async () => {


        let httpService = app.injector.get<HttpService>(HttpService);

        try {
            let result = await httpService.request<{ id: number }>({
                method: "get", timeout: 1000,
                retry: 0,
                url: "http://google.com/aaaa"
            })

            result.status.should.not.be.eq(200);


        } catch (e) {
            e.response.status.should.be.eq(404);
            e.config.currentRetryAttempt.should.be.eq(0);
        }


    });

    it('should throw error with retry', async () => {

        let httpService = app.injector.get<HttpService>(HttpService);

        try {
            let result = await httpService.request<{ id: number }>({
                method: "get", retry: 2, timeout: 500,
                url: "http://google.com/aaaa"
            })

            result.status.should.not.be.eq(200);


        } catch (e) {
            e.config.currentRetryAttempt.should.be.eq(2);
        }


    });

    it('should get with fallback', async () => {


        let httpService = app.injector.get<HttpService>(HttpService);

        let result = await httpService.request<{ id: number }>({
            method: "get",
            url: "http://google.com/aaaa",
            fallbackUrls: ["http://google.com"],
        })

        result.status.should.be.eq(200)


    });

    it('should throw with fallback', async () => {

        try {
            let httpService = app.injector.get<HttpService>(HttpService);

            let result = await httpService.request<{ id: number }>({
                method: "get", retry: 0,
                url: "http://google.com/aaaa",
                fallbackUrls: ["http://google.com/bbbb"],
            })

            result.status.should.not.be.eq(200);

        } catch (e) {
            e.response.status.should.be.eq(404);
            e.config.url.should.be.eq("http://google.com/bbbb")
            e.statusCode.should.be.eq(404);
        }


    });


    it('should throw with hard timeout ', async () => {

        try {
            let httpService = app.injector.get<HttpService>(HttpService);

            let result = await httpService.request<{ id: number }>({
                method: "get",
                hardTimeout:1,
                url: "http://google.com",
            })

            result.status.should.not.be.eq(200);

        } catch (e) {
            e.message.should.be.eq("timeout of 1ms exceeded")
            e.config.url.should.be.eq("http://google.com")
            e.statusCode.should.be.eq(0);
        }


    });

});

