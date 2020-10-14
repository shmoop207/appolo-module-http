export class Util {
     public static combineURLs(baseURL:string, relativeURL:string):string {
        return relativeURL
            ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
            : baseURL;
    };
}
