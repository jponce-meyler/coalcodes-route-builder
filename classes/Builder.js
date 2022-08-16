import * as espree from "espree";
import routeParser from "../helpers/route-parser.js";
import { attachComments, attachSource } from "../helpers/attachers.js";
import fs from "fs";

export default class Builder {
    contents = []

    constructor(source, destination, options = {}) {

        if (typeof source === 'string') { source = [source] }
        this.source = source

        if (typeof destination === 'string') { destination = [destination] }
        this.destination = destination

        this.options = Builder.getOptions(options)
    }

    getContents() {
        if (typeof this.source === 'function') {
            this.contents = this.source()
        } else if (Array.isArray(this.source)) {
            this.contents = this.source.map(file => fs.readFileSync(file, 'utf8').toString())
        }
        return this.contents
    }

    parse() {
        return this.routes = this.contents.map(
            content => attachComments(
                routeParser(
                    espree.parse(
                        content,
                        {
                            ecmaVersion: "latest",
                            comment: true,
                            range: true,
                            sourceType: "module"
                        }
                    )
                )
            )
        )
    }

    build() {
        this.getContents()
        this.parse()
        return this.routes
    }

    static strategies = {
        copyTree: 'copyTree',
        flat: 'flat'
    }

    static settings = {
        strategy: this.strategies.flat,
        scanFolder: true,
        sourceAttacher: attachSource
    }

    static getOptions(options) {
        options = Object.assign({}, Builder.settings, options)
        if (!Object.entries(this.strategies).includes(options.strategy)) {
            options.strategy = this.strategies.flat
        }
        return options
    }

}
