import {Module, module,IModuleParams} from "@appolo/engine";
import {HttpService, IOptions} from "../index";
import {Defaults} from "./src/defaults";


@module()
export class HttpModule extends Module<IOptions> {

    protected readonly Defaults: Partial<IOptions> = Defaults;



    public static for(options?: IOptions): IModuleParams {
        return {type:HttpModule,options};
    }
    public get exports() {
        return [{id: this.moduleOptions.id, type: HttpService}];
    }
}
