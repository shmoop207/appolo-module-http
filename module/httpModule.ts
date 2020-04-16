import {Module, module} from "appolo/index";
import {HttpService, IOptions} from "../index";
import {Defaults} from "./src/defaults";


@module()
export class HttpModule extends Module<IOptions> {

    protected readonly Defaults: Partial<IOptions> = Defaults;

    constructor(opts?: IOptions) {
        super(opts);
    }

    public static for(opts?: IOptions): HttpModule {
        return new HttpModule(opts);
    }

    public get exports() {
        return [{id: this.moduleOptions.id, type: HttpService}];
    }
}
