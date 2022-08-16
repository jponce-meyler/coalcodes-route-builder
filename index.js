import BuilderClass  from "./classes/Builder.js";
import RouteClass   from "./classes/Route.js";

const builder = (source, destination, options) => {
    try {
        return (new BuilderClass(source, destination, options)).build()
    } catch (error) {
        if (process.env === 'development' || process.debug === true) {
            console.log(error)
        }
        return []
    }
}

// awful hack to use the builder's classes with any import
builder.Builder = BuilderClass;
builder.Route = RouteClass;

export const Builder = BuilderClass;
export const Route = RouteClass;

export default builder;
