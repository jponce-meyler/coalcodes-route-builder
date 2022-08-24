import BuilderClass  from "./classes/Builder.js";

const builder = (source, destination, options) => {
    try {
        let test = new BuilderClass(source, destination, options)
        let result = test.build()
        return test.build()
    } catch (error) {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === true) {
            console.log(error)
        }
        return []
    }
}

// awful hack to use the builder's classes with any import
builder.Builder = BuilderClass;

export const Builder = BuilderClass;

export default builder;
