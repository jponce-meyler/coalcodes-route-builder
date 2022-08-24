

/**
 * @Route(path="" method=GET)
 */
export const listOrders = (req, res) => {
    res.status(200)
        .json([{code: "order-1"}, {code: "order-2"}])
}

/**
 * @Route(path="/:id", method=GET)
 */
export const getOrder = (req, res) => {
    res.status(200)
        .json({code: "order-1"})
}

/**
 * @Route(path="/" method=POST, roles=['ADMIN'])
 */
export const createOrder = (req, res) => {
    res.status(200)
        .json({code: "order-3"})
},  testing = (req, res) => {
    res.status(200)
        .json({code: "order-3"})
}


/**
 * @Route(path="/order" method=GET)
 */
export default (req, res) => {
    res.status(200)
        .json([{code: "order-1"}, {order: "order-2"}])
}

/**
 * @Route(path="/" method=POST, roles=['ADMIN'])
 */
export function test (req, res) {
    res.status(200)
        .json({code: "order-3"})
}
