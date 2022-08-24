import builder from "../../index.js";
import express from "express";

builder('./controllers', './routes')

import Routing from './routes/index.js'
const app = express();
app.use((req, res, next) => {
    req.user = {
        role: 'ADMIN'
    }
    next()
})
app.use(Routing(new express.Router()));
app.listen(3000, () => {
    console.log('listening on port 3000')
})

