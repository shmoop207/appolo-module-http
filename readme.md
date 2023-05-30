Http Service module for [`appolo`](https://github.com/shmoop207/appolo) build with [axios](https://github.com/axios/axios)

## Installation

```javascript
npm i @appolo/http
```


in config/modules/all.ts

## Options
| key | Description | Type | Default
| --- | --- | --- | --- |
| `id` | `httpService` injection id | `string`|  `httpService`|

any option from `Request Config` can be added and will be added to all request.

```javascript
import {HttpModule} from '@appolo/http';

export = async function (app: App) {
   await app.module(new HttpModule({baseURL:"https://some-domain.com/api/",retry:2}));
}
```

## Usage

```javascript
import {define, singleton,inject} from 'appolo'
import {publisher} from "@appolo/http";

@define()
@singleton()
export class SomeManager {

    @inject httpService:HttpService

    async getUserId(): Promise<string> {

        let result = await this.httpService.request<{userId:string}>({
            url:"http://someurl"
            method:"post"
            timeout:1000
            retry:3
        })

        return result.data.userId
    }
}
```

## Request Config
| key                 | Description                                                                   | Type | Default
|---------------------|-------------------------------------------------------------------------------| --- | --- |
| `url`               | `request url                                                                  | `string`|  ``|
| `method`            | is the request method to be used when making the request                      | `string` | `get` |
| `baseURL`           | `baseURL` will be prepended to `url` unless `url` is absolute                 | `string` | `` |
| `headers`           | custom headers                                                                | `object` | `{}` |
| `params`            | are the URL parameters to be sent with the request                            | `object` | `{}` |
| `data`              | the data to be sent as the request body                                       | `object` | `{}` |
| `timeout`           | specifies the number of milliseconds before the request times out             | `number` | `0` |
| `withCredentials`   | indicates whether or not cross-site Access-Control requests                   | `boolean` | `false` |
| `auth`              | indicates that HTTP Basic auth should be used, and supplies credentials       | `object` | `{}` |
| `authDigest`        | indicates that HTTP Digest Auth should be used, and supplies credentials      | `object` | `{}` |
| `responseType`      | indicates the type of data that the server will respond with                  | `string` | `json` |
| `responseEncoding`  | indicates encoding to use for decoding responses                              | `string` | `utf8` |
| `maxRedirects`      | defines the maximum number of redirects to follow in node.js                  | `number` | `5` |
| `retry`             | retry  times on requests that return a response (500, etc) before giving up   | `number` | `0` |
| `noResponseRetries` | etry times on errors that don't return a response (ENOTFOUND, ETIMEDOUT, etc) | `number` | `0` |
| `retryDelay`        | Milliseconds to delay at first                                                | `number` | `100` |

