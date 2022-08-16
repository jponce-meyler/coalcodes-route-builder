const {Catalog} = require("../models");
const fs = require("fs");

/**
 * @Route (path="/catalog", roles=[ADMIN, SUPERADMIN])
 */
export class CatalogController {

    /**
     * @Route (path="", method=POST, roles=SUPERADMIN)
     *
     * @param req
     * @param res
     */
    getMany(req, res) {
        Catalog.getFromFilter(Catalog.parseFilterFromBody(req.body))
            .then(result => {
                res.status(200)
                    .json({success: "OK", data: result});
            })
        console.log(req.body)
    }

    /**
     * @Route (path="/import", method=PUT)
     *
     * @param req
     * @param res
     */
    createMany(req, res) {
        // check if any products was sent
        if (!req.body.products || (!req.body.products.length && !req.body.products.data.length)) {
            res.status(200)
                .json({success: "OK"})
        }

        let promises = []
        let products = req.body.products
        let errors = []
        if (!Array.isArray(products) && products.parser && Array.isArray(products.data)) {
            products = products.data.map(row => {
                let object = {}
                products.parser.forEach((field, index) => object[field] = row[index])
                object.stores = object.stores.map(store => {
                    return {
                        "supplier": store[0],
                        "id_am" : store[1],
                        "price" : store[2],
                        "id_manufacturer" : store[3],
                        "units_purchasable" : parseInt(store[4].replace(',', '.')),
                        "units_minimum" :parseInt(store[5].replace(',', '.')),
                        "units_package" : store[6],
                        "id_supplier" : store[7]
                    }
                })
                return object
            })
        }

        // iterate until there is any products
        while (products.length > 0) {
            // start the bulk operation every time to avoid
            let bulkOperation = Catalog.collection.initializeUnorderedBulkOp();
            let chunk = products.slice(0, 10000)
            products = products.slice(10000)

            // elaborate the current chunk
            chunk.forEach(element => {
                let doc = new Catalog(element)
                // automatic generate the code
                doc.generateCode()

                // validate from schema validation
                let validation = doc.validateSync()

                // check if there is some error inside `validation`, usually empty
                if (validation) {
                    // save errors to return inside the response
                    element._errors = {}
                    Object.keys(element).forEach(key => {
                        if (validation.errors[key]) {
                            element._errors[key] = validation.errors[key].message
                        }
                    })

                    // if the error is not inside the received object could be inside the doc or this function
                    if (element._errors.length <= 0) {
                        element._errors = {
                            system: "Some internal check failed with this data"
                        }
                    }
                    errors.push(element)
                    return;
                }

                // regenerate the keywords from the doc properties
                doc.generateKeywords()

                bulkOperation.insert(doc)
            })

            // put the execution inside the queue
            promises.push(new Promise((resolve, reject) => {
                bulkOperation.execute(
                    bulkWriteResult => {
                        // bulkWriteResult contains the errors
                        if (bulkWriteResult && bulkWriteResult.writeErrors) {
                            bulkWriteResult.writeErrors = bulkWriteResult.writeErrors.filter(element => element.code !== 11000)
                            if (bulkWriteResult.writeErrors.length > 0) {
                                // todo: log correctly the errors
                                console.info("HEY!", "Error in BULK operation " + JSON.stringify(bulkWriteResult.writeErrors));
                                reject(bulkWriteResult)
                                return;
                            }
                        }
                        console.log(`Bulk operation with max 10000 rows was executed`)
                        resolve(bulkWriteResult)
                    }
                );
            }))
        }
        console.log(`Start waiting bulks`)

        // inside `result` or `e` there are the errors and the inserted docs
        // todo: send back the errors from mongo
        Promise.all(promises)
            .then(() => {
                console.log(req)
                res.status(200)
                    .json({success: "OK", errors: errors})
            })
            .catch((e) => {
                console.log(e)
                res.status(200)
                    .json({success: "OK", errors: errors})
            })
    }


    /**
     * @Route(path="/update", method=[PATCH, PUT])
     *
     * @param req
     * @param res
     */
    updateMany (req, res) {
        // check if any products was sent
        if (!req.body.products || (!req.body.products.length && !req.body.products.data.length)) {
            res.status(200)
                .json({success: "OK"})
        }

        let promises = []
        let products = req.body.products
        let errors = []

        // iterate until there is any products
        while (products.length > 0) {
            // start the bulk operation every time to avoid
            let bulkOperation = Catalog.collection.initializeUnorderedBulkOp();
            let chunk = products.slice(0, 10000)
            products = products.slice(10000)

            // elaborate the current chunk
            chunk.forEach(element => {
                delete element.stores;
                let doc = new Catalog(element)
                // automatic generate the code
                doc.generateCode()

                // validate from schema validation
                let validation = doc.validateSync()

                // check if there is some error inside `validation`, usually empty
                if (validation) {
                    // save errors to return inside the response
                    element._errors = {}
                    Object.keys(element).forEach(key => {
                        if (validation.errors[key]) {
                            element._errors[key] = validation.errors[key].message
                        }
                    })

                    // if the error is not inside the received object could be inside the doc or this function
                    if (element._errors.length <= 0) {
                        element._errors = {
                            system: "Some internal check failed with this data"
                        }
                    }
                    errors.push(element)
                    return;
                }

                // regenerate the keywords from the doc properties
                doc.generateKeywords()
                let updatable = {}
                Object.keys(element).forEach(key => {
                    if (doc[key] != undefined) {
                        updatable[key] = doc[key]
                    }
                })

                bulkOperation.find( { code: doc.code } ).update( { $set: updatable } );
            })

            // put the execution inside the queue
            promises.push(new Promise((resolve, reject) => {
                bulkOperation.execute(
                    bulkWriteResult => {
                        // bulkWriteResult contains the errors
                        if (bulkWriteResult && bulkWriteResult.writeErrors) {
                            bulkWriteResult.writeErrors = bulkWriteResult.writeErrors.filter(element => element.code !== 11000)
                            if (bulkWriteResult.writeErrors.length > 0) {
                                // todo: log correctly the errors
                                console.info("HEY!", "Error in BULK operation " + JSON.stringify(bulkWriteResult.writeErrors));
                                reject(bulkWriteResult)
                                return;
                            }
                        }
                        console.log(`Bulk operation with max 10000 rows was executed`)
                        resolve(bulkWriteResult)
                    }
                );
            }))
        }
        console.log(`Start waiting bulks`)

        // inside `result` or `e` there are the errors and the inserted docs
        // todo: send back the errors from mongo
        Promise.all(promises)
            .then(() => {
                console.log(req)
                res.status(200)
                    .json({success: "OK", errors: errors})
            })
            .catch((e) => {
                console.log(e)
                res.status(200)
                    .json({success: "OK", errors: errors})
            })
    }

    /**
     * @Route(path="/update-supplier", method=[PATCH, PUT])
     *
     * @param req
     * @param res
     */
    updateSupplierMany (req, res) {
        // check if any products was sent and any supplier
        if (!req.body.products || (!req.body.products.length && !req.body.products.data.length) || !req.body.supplier) {
            res.status(200)
                .json({success: "OK"})
        }
        let supplier = req.body.supplier
        let promises = []
        let products = req.body.products
        if (!Array.isArray(products) && products.parser && Array.isArray(products.data)) {
            products = products.data.map(row => {
                let object = {}
                products.parser.forEach((field, index) => object[field] = row[index])
                return object
            })
        }
        let errors = []
        while (products.length > 0) {
            // start the bulk operation every time to avoid
            let bulkOperation = Catalog.collection.initializeUnorderedBulkOp();
            let chunk = products.slice(0, 5000)
            products = products.slice(5000)

            // elaborate the current chunk
            chunk.forEach(element => {

                let id_brand = element.id_brand
                let id_kromeda = element.id_kromeda
                delete element.id_brand
                delete element.id_kromeda

                element.supplier = supplier

                let doc = new Catalog({
                    id_brand: id_brand,
                    id_kromeda: id_kromeda,
                    stores: [
                        element
                    ]
                })
                // automatic generate the code
                doc.generateCode()

                // validate from schema validation
                let validation = doc.validateSync()

                // check if there is some error inside `validation`
                if (validation) {
                    element.id_brand = id_brand
                    element.id_kromeda = id_kromeda
                    delete element.supplier

                    // save errors to return inside the response
                    element._errors = {}
                    Object.keys(element).forEach(key => {
                        if (validation.errors[key]) {
                            element._errors[key] = validation.errors[key].message
                        }
                    })

                    // if the error is not inside the received object could be inside the doc or this function
                    if (element._errors.length <= 0) {
                        element._errors = {
                            system: "Some internal check failed with this data"
                        }
                    }
                    errors.push(element)
                    return;
                }

                // todo: upload history (maybe only for prices)
                let store = doc.stores.shift()
                bulkOperation
                    .find({code: doc.code})
                    .arrayFilters( [ { "element.supplier": element.supplier } ] )
                    .updateOne( { $set: { "stores.$[element]" : store } } )
                bulkOperation
                    .find({code: doc.code, "stores": {$not: { "$elemMatch": {"supplier": element.supplier}}}})
                    .updateOne( { $push: { "stores" : store } } )
            })

            // put the execution inside the queue
            promises.push(new Promise((resolve, reject) => {
                bulkOperation.execute(
                    bulkWriteResult => {
                        // bulkWriteResult contains the errors
                        if (bulkWriteResult && bulkWriteResult.writeErrors) {
                            // todo: log correctly the errors
                            console.info("HEY!", "Error in BULK operation " + JSON.stringify(bulkWriteResult.writeErrors));
                            reject(bulkWriteResult)
                            return;
                        }
                        console.log(`Bulk operation with mac 5000 rows was executed`)
                        resolve(bulkWriteResult)
                    }
                );
            }))
        }
        console.log(`Start waiting bulks`)

        // inside `result` or `e` there are the errors and the inserted docs
        // todo: send back the mongo errors
        Promise.all(promises)
            .then(() => {
                res.status(200)
                    .json({success: "OK", errors: errors})
            })
            .catch((e) => {
                console.log(e)
                res.status(200)
                    .json({success: "OK", errors: errors})
            })
    }


    /**
     * @Route(path="/extract", method=GET)
     *
     * @param req
     * @param res
     */
    extractCustom(req, res) {
        let brands = [
            "000",
            "002",
            "009",
            "012",
            "013",
            "016",
            "017",
            "020",
            "027",
            "028",
            "029",
            "030",
            "032",
            "035",
            "040",
            "043",
            "045",
            "050",
            "055",
            "057",
            "059",
            "060",
            "061",
            "062",
            "066",
            "070",
            "073",
            "077",
            "079",
            "080",
            "083",
            "089",
            "100",
            "103",
            "104",
            "111",
            "113",
            "114",
            "116",
            "117",
            "119",
            "124",
            "127",
            "129",
            "130",
            "131",
            "133",
            "134",
            "141",
            "142",
            "143",
            "144",
            "145",
            "157",
            "165",
            "170",
            "172",
            "173",
            "179",
            "184",
            "186",
            "188",
            "190",
            "193",
            "195",
            "197",
            "207",
            "208",
            "213",
            "217",
            "221",
            "224",
            "227",
            "228",
            "22A",
            "231",
            "232",
            "233",
            "238",
            "239",
            "242",
            "244",
            "246",
            "247",
            "252",
            "279",
            "302",
            "309",
            "319",
            "327",
            "328",
            "334",
            "338",
            "341",
            "346",
            "347",
            "348",
            "350",
            "352",
            "356",
            "360",
            "363",
            "364",
            "375",
            "377",
            "378",
            "388",
            "397",
            "407",
            "409",
            "412",
            "418",
            "420",
            "421",
            "422",
            "428",
            "439",
            "443",
            "444",
            "455",
            "458",
            "462",
            "466",
            "468",
            "469",
            "471",
            "474",
            "481",
            "483",
            "489",
            "490",
            "496",
            "498",
            "501",
            "517",
            "526",
            "529",
            "551",
            "567",
            "583",
            "587",
            "599",
            "758",
            "848",
            "924",
            "926",
            "934",
            "999",
            "K01",
            "K02",
            "K05",
            "K06",
            "K07",
            "K10",
            "K15",
            "K17",
            "K18",
            "K19",
            "K24",
            "K25",
            "K26",
            "K27",
            "K28",
            "K29",
            "K30",
            "K31",
            "K32",
            "K33",
            "K34",
            "K35",
            "K39",
            "K40",
            "K44",
            "K45",
            "K46",
            "L39",
            "P11"
        ]
        let promises = []
        brands.forEach(brand => {
            promises.push(Catalog.find({id_brand: brand}).lean(true).then(result => {
                console.log(`Brand ${brand} done.`)
                let file = fs.createWriteStream(`../catalog/${brand}.csv`, {flags: 'w+'})
                file.write(`codice listino;id kromeda;brand;descrizione;magazzini;cati prezzo;cati unità;cati confezione;idir prezzo;idir unità;idir confezione;cida prezzo;cida unità;cida confezione;sidat prezzo;sidat unità;sidat confezione\n`)
                result.forEach(product => {
                    let line = []
                    line.push(product.id_brand)
                    line.push(product.id_kromeda)
                    line.push(product.brand!=""?product.brand:product.family)
                    line.push(product.description.replace(';', ''))
                    let cati = product.stores.find(store => store.supplier == 'cati')
                    let idir = product.stores.find(store => store.supplier == 'idir')
                    let cida = product.stores.find(store => store.supplier == 'cida')
                    let sidat = product.stores.find(store => store.supplier == 'sidat')
                    line.push(0 + !!cati + !!idir + !!cida + !!sidat)

                    cati = cati || {}
                    line.push((cati.price || "").replace('.', ','))
                    line.push(cati.units_purchasable || "")
                    line.push(cati.units_package || "")

                    idir = idir || {}
                    line.push((idir.price || "").replace('.', ','))
                    line.push(idir.units_purchasable || "")
                    line.push(idir.units_package || "")

                    cida = cida || {}
                    line.push((cida.price || "").replace('.', ','))
                    line.push(cida.units_purchasable || "")
                    line.push(cida.units_package || "")

                    sidat = sidat || {}
                    line.push((sidat.price || "").replace('.', ','))
                    line.push(sidat.units_purchasable || "")
                    line.push(sidat.units_package || "")

                    file.write(`${line.join(';')}\n`)
                })
                console.log()
                file.end()
            }))
        })
        Promise.all(promises).then(() => {
            res.status(200).json({success: 'OK'})
        })
    }
}

