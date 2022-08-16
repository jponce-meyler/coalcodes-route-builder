
/**
 * @Route(path="/user/" method=GET)
 */
export const listUsers = (req, res) => {
    res.status(200)
        .json([{username: "user-1"}, {username: "user-2"}])
}

/**
 * @Route(path="/user/:id", method=GET)
 */
export const getUser = (req, res) => {
    res.status(200)
        .json({username: "user-1"})
}

/**
 * @Route(path="/user/" method=POST, roles=['ADMIN'])
 */
export const createUser = (req, res) => {
    res.status(200)
        .json({username: "user-3"})
},  testing = (req, res) => {
    res.status(200)
        .json({username: "user-3"})
}

/**
 * @Route(path="/user/" method=POST, roles=['ADMIN'])
 */
export function test (req, res) {
    res.status(200)
        .json({username: "user-3"})
}
