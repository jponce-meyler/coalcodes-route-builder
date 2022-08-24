

/**
 * @Route (path="/products", roles=[ADMIN, SUPERADMIN])
 */
export default class ProductsController {

    /**
     * @Route (path="", method=POST, roles=SUPERADMIN)
     *
     * @param req
     * @param res
     */
    static getMany(req, res) {
        console.log(req.body)
    }

    /**
     * @Route (path="/:id", method=GET)
     *
     * @param req
     * @param res
     */
    static getOne(req, res) {
        console.log(req.body)
    }
}

