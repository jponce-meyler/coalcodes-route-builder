/**
 * @Route (path="/catalog", roles=[ADMIN, SUPERADMIN])
 */
export default class CatalogController {

    /**
     * @Route (path="", method=POST, roles=SUPERADMIN)
     *
     * @param req
     * @param res
     */
    static getMany(req, res) {
        console.log("getMany")
    }

    /**
     * @Route (path="/import", method=PUT, roles=[ADMIN, SUPERADMIN])
     *
     * @param req
     * @param res
     */
    static createMany(req, res) {
        console.log("createMany")
    }


    /**
     * @Route(path="/update", method=[PATCH, PUT], roles=SUPERADMIN)
     *
     * @param req
     * @param res
     */
    static updateMany(req, res) {
        console.log("updateMany")
    }
    /**
     * @Route(path="/update-supplier", method=[PATCH, PUT])
     *
     * @param req
     * @param res
     */
    static updateSupplierMany(req, res) {
        console.log("updateSupplierMany")
    }

    /**
     * @Route(path="/extract", method=GET)
     *
     * @param req
     * @param res
     */
    static extractCustom(req, res) {
        console.log("extractCustom")
    }
}

