import {define, factory, IFactory, inject, singleton} from 'appolo';
import axios, {AxiosInstance} from 'axios'
import {IOptions} from "./IOptions";
import rax = require('retry-axios');

@define()
@singleton()
@factory()
export class HttpRetryProvider implements IFactory<AxiosInstance> {

    @inject() moduleOptions: IOptions;

    public get(): AxiosInstance {

        let instance = axios.create({
            ...this.moduleOptions
        });


        instance.defaults = {
            raxConfig: {
                instance: instance,
            }
        } as any;

        rax.attach(instance);


        return instance

    }
}


