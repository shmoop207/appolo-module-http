import {App, createApp} from 'appolo'
import {HttpModule, HttpService, ResponseError} from '../'

let should = require('chai').should();


describe("socket module Spec", function () {

    let app: App;

    beforeEach(async () => {

        app = createApp({root: __dirname, environment: "production", port: 8182});

        await app.module(new HttpModule({

            retry: 2, retryDelay: 100, noResponseRetries: 2

        }));

        await app.launch();

    });

    afterEach(async () => {
        await app.reset();
    });

    it('should get json', async () => {


            let httpService = app.injector.get<HttpService>(HttpService);

            let result = await httpService.request<{id:number}>({
                method: "get",
                url: "https://jsonplaceholder.typicode.com/todos/1"
            })

            result.status.should.be.eq(200);
            result.data.id.should.be.eq(1);

    });

    it('should throw error', async () => {


        let httpService = app.injector.get<HttpService>(HttpService);

        try{
            let result = await httpService.request<{id:number}>({
                method: "get",
                url: "https://jsonplaceholder.typicode.com/todo2s/1"
            })

        }catch (e) {
            e.response.status.should.be.eq(404);
        }
        
        

    });

    it('should throw error with retry', async () => {


        let httpService = app.injector.get<HttpService>(HttpService);

        try{
            let result = await httpService.request<{id:number}>({
                method: "get",
                url: "https://jsonplaceholder2.typicode.com/todos/1"
            })

        }catch (e) {
            e.config.raxConfig.currentRetryAttempt.should.be.eq(2);
        }



    });



});

