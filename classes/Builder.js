import * as espree from "espree";
import routeParser from "../helpers/route-parser.js";
import {attachComments, attachSource} from "../helpers/attachers.js";
import fs from "fs";
import * as path from "path";

export default class Builder {
    contents = []

    constructor(source, destination, options = {}) {

        if (typeof source === 'string') {
            source = [source]
        }
        this.source = source

        // if (typeof destination === 'string') {
        //     destination = [destination]
        // }
        this.destination = path.resolve(destination)

        this.options = Builder.getOptions(options)
    }

    getContents(source = this.source) {
        if (typeof source === 'function') {
            this.contents = source()
        } else if (Array.isArray(source)) {
            this.contents = source.map(file => {
                file = path.resolve(file)
                if (fs.lstatSync(file).isDirectory()) {
                    return this.getContents(fs.readdirSync(file).map(childFile => path.join(file, childFile)))
                }
                return {
                    reference: file,
                    text: fs.readFileSync(file, 'utf8').toString()
                }
            })
            this.contents = this.contents.flat()
        }
        return this.contents
    }

    parse() {
        return this.routes = this.contents
            .map(
                ({text, reference}) => routeParser(
                    attachComments(
                        espree.parse(
                            text,
                            {
                                ecmaVersion: "latest",
                                comment: true,
                                range: true,
                                sourceType: "module"
                            }
                        )
                    )
                    , path.relative(this.destination, reference)
                )
            )
            .flat()
    }

    routesToJs(js = '') {
        let imports = Array.from(new Set(this.routes.map(route => {
            return `import ${route.className} from "${route.file}"`
        }))).join('\n')

        let routes = this.routes
            .map(route => {
                if (!Array.isArray(route.method)) {
                    route.method = [route.method]
                }
                return route.method.map(method => {
                    return {...route, ...{method: method}}
                })
            })
            .flat()
            .map(route => {
                return this.options.wrappers.route(route, this.options.wrappers.auth(route, this.options.wrappers.forbidden(route)))
                // return `\t${route.method}("${route.path}", ${route.className}.${route.classMethod})`
            })

        routes = this.options.wrappers.routes(routes.join('\n'))

        return [imports, routes].join('\n\n')
    }

    write(js) {
        fs.writeFileSync(path.join(this.destination, 'index.js'), js)
    }

    build() {
        this.getContents()
        this.parse()
        let js = this.routesToJs()
        this.write(js)
        return this.routes
    }

    static strategies = {
        copyTree: 'copyTree',
        flat: 'flat'
    }

    static settings = {
        strategy: this.strategies.flat,
        scanFolder: true,
        sourceAttacher: attachSource,
        wrappers: {
            routes: (content) => `export default (router) => {\n${content}\n\treturn router\n}`,
            route: (route, auth) => `\trouter.${route.method.toLowerCase()}("${route.path}", ${auth})`,
            auth: (route, forbidden) => `(req, res, next) => {\n\t\tif (${JSON.stringify(route.role)}.includes(req.user.role)) {\n\t\t\treturn ${route.className}.${route.classMethod}(req, res, next)\n\t\t}\n\t\t${forbidden}\n\t}`,
            forbidden: () => `res.status(403).send("You do not have permission to access this resource")`
        }
    }

    static getOptions(options) {
        options = Object.assign({}, Builder.settings, options)
        if (!Object.entries(this.strategies).includes(options.strategy)) {
            options.strategy = this.strategies.flat
        }
        return options
    }

}
