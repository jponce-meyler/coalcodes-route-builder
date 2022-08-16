import * as path from 'path';
import builder from "../../index.js";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(__filename)
console.log(__dirname)
console.log(builder.Route)
console.log(builder.Builder)
