# CoalCodes Route Builder

A tool to make easier the creation of routes inside most frameworks.\
Simple to use and customizable

## Installation
Install this package using [NPM](https://www.npmjs.com/).

As a good practice it is recommended to install as development dependency because this module
create all files necessary for the routing, you can bring these files to production.

```bash
npm install --save-dev coalcodes-route-builder
```

## Usage

```js
import builder from 'coalcodes-route-builder';
builder(`path/to/controllers`, `path/to/routes`);
```

### Builder Class
```js
import {Builder} from 'coalcodes-route-builder';

let apiV1 = new Builder(`api/v1/controllers`, `api/v1/routes`);
apiV1.build();

let apiV2 = new Builder(`api/v2/controllers`, `api/v2/routes`);
apiV2.build();
```

### Route Class
```js
import {Route} from 'coalcodes-route-builder';

let customRoute = new Route(`api/v1/controllers`, `api/v1/routes`);
```
