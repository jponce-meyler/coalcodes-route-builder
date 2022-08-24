export default (data, file) => {
    return extractRoutesFromProgram(data, file)
}

export const extractRoutesFromProgram = (data, file) => {
    if (data.type !== 'Program') {
        return []
    }
    let currentClassHolder = data.body
        .filter(item => ['ExportDefaultDeclaration', 'ExportNamedDeclaration'].includes(item.type))
        .sort((a, b) => {
            if (a.type === b.type) return 0
            if (a.type === 'ExportDefaultDeclaration') return -1
            if (b.type === 'ExportDefaultDeclaration') return 1
            return 0
        })
        .find(item => item.declaration.type === 'ClassDeclaration')
    if (!currentClassHolder) {
        return []
    }
    let currentClass = currentClassHolder.declaration
    let comments = [...currentClassHolder.leadingComments || [], ...currentClass.leadingComments || []]
    let parent = extractRouteFromComment(comments.reduce((prev, curr) => prev + ' ' + curr.value, ''))
    let methods = currentClass.body.body.filter(item => item.type === 'MethodDefinition' && item.static === true)
    let routes = methods.map(item => {
        let comments = [...item.leadingComments || []]
        let route = extractRouteFromComment(comments.reduce((prev, curr) => prev + ' ' + curr.value, ''))
        route.file = file.split('\\').join('/')
        route.className = currentClass.id.name
        route.classMethod = item.key.name
        return route
    })
    if (parent) {
        if (parent.role && !Array.isArray(parent.role)) {
            parent.role = [parent.role]
        }
        if (parent.method && !Array.isArray(parent.method)) {
            parent.method = [parent.method]
        }
        routes.forEach(item => {
            item.path = (parent.path || '') + item.path
            if (parent.role) {
                if (!Array.isArray(item.role)) {
                    item.role = [item.role]
                }
                item.role = item.role.filter(role => parent.role.includes(role))
            }
            if (parent.method) {
                if (!Array.isArray(item.method)) {
                    item.method = [item.method]
                }
                item.method = item.method.filter(method => parent.method.includes(method))
            }
        })
    }
    return routes
}

export const extractRoutesFromDeclaration = (declaration, prependedComments = []) => {
    let routes = []
    let comments = [...prependedComments, ...declaration.leadingComments || []]
        .reduce((prev, curr) => prev + ' ' + curr.value, '')
        .trim()
    if (declaration.type === 'FunctionDeclaration') {
        if (comments) {
            let route = extractRouteFromComment(comments)
            routes.push(route)
        }
    }


    if (declaration.type === 'ClassDeclaration') {
        if (declaration.leadingComments) {
            let comment = [...commentsCarried, ...declaration.leadingComments].reduce((prev, curr) => prev + ' ' + curr.value, '')
            routes = parseRoutesFromData(declaration.body, extractRouteFromComment(comment))
        }
    } else if (declaration.type === 'VariableDeclaration') {
        if (declaration.leadingComments) {
            let comment = [...commentsCarried, ...declaration.leadingComments].reduce((prev, curr) => prev + ' ' + curr.value, '')
            let route = extractRouteFromComment(comment)
            routes.push(route)
        }
    } else if (declaration.type === 'FunctionDeclaration') {
        if (declaration.leadingComments) {
            let comment = [...commentsCarried, ...declaration.leadingComments].reduce((prev, curr) => prev + ' ' + curr.value, '')
            let route = extractRouteFromComment(comment)
            routes.push(route)
        }
    } else {
        console.log('Unknown type', declaration.type)
    }
    return routes
}

export const extractRoutesFromClass = (classDeclaration) => {

}


export const extractRouteFromComment = (comment) => {
    let route = {
        path: '',
        method: '',
        role: ''
    }
    let params = extractRouteContent(comment)
    if (params === false) {
        return null
    }
    params.forEach(param => {
        switch (param.arg) {
            case 'path':
                route.path = param.value;
                break;
            case 'method':
            case 'methods':
                route.method = param.value;
                break;
            case 'role':
            case 'roles':
                route.role = param.value;
                break;
        }
    })
    return route
}

// parse the comment decorator trying to extract the route information avoiding false positives
export const extractRouteContent = (comment) => {
    let copy = comment
    copy = getCopyWithBlankStrings(copy)
    copy = getCopyWithBlankStrings(copy)
    copy = getCopyWithoutDecorations(copy)

    // get only Route decorator content
    let regex = /@Route\s*\(/gm
    let content = regex.exec(copy)
    if (!content || copy.indexOf(')') <= content.index) {
        return false
    }
    copy = ''.padEnd(content.index + content[0].length, ' ') + copy.substring(content.index + content[0].length, copy.indexOf(')'))

    let args = [...copy.matchAll(/(,(?=\s*[a-z0-9_]+=)|[a-z0-9_]+=)/gmi)]
    let commas = args.filter(item => item[0] === ',')
    commas.forEach(item => {
        comment = comment.substring(0, item.index) + ' ' + comment.substring(item.index + item[0].length)
    })
    args = args.filter(item => item[0] !== ',')
        .reverse()
    let lastIndex = copy.length
    return args.map(item => {
        let index = item.index
        let arg = comment.substring(index, lastIndex)
        lastIndex = index
        return {
            arg: arg.substring(0, item[0].length - 1),
            value: parseArgValue(arg.substring(item[0].length))
        }
    })
}


// remove all strings surrounded by quotation in a string
export const getCopyWithBlankStrings = (text) => {
    let regexStrings = /(["'])(?:\1|[^\\]|\\.)*?\1/gmi
    let strings = [...text.matchAll(regexStrings)]
    strings.forEach(string => {
        let stringValue = string[0]
        text = text.substring(0, string.index) + ''.padEnd(stringValue.length, ' ') + text.substring(string.index + stringValue.length)
    })
    return text
}

// remove all array surrounded by box brackets in a string
export const getCopyWithBlankArrays = (text) => {
    let regexArrays = /((?<=(\[))(?:(?=(\\?))\3.)*?(?=\])\])/gmi
    let arrays = [...text.matchAll(regexArrays)]
    arrays.forEach(array => {
        text = text.substring(0, array.index - 1) + ''.padEnd(array[0].length + 1, ' ') + text.substring(array.index + array[0].length)
    })
    return text
}

// remove all useless spaces and comment decorations [*]
export const getCopyWithoutDecorations = (text) => {
    let regexDecorations = /(^|)\s*[*]+\s*/gmi
    let decorations = [...text.matchAll(regexDecorations)]
    decorations.forEach(decoration => {
        text = text.substring(0, decoration.index) + ''.padEnd(decoration[0].length - 1, ' ') + text.substring(decoration.index + decoration[0].length - 1)
    })
    return text
}

// get the value of an argument as an Array or string even if is not surrounded by quotation
export const parseArgValue = (value) => {
    value = value.trim()
    if (value === '') {
        return value
    }

    let copy = getCopyWithBlankStrings(value)
    if (copy.trim() === '') {
        return value.substring(1, value.length - 1)
    }

    copy = getCopyWithBlankArrays(value)
    if (copy.trim() === '') {
        value = value.substring(1, value.length - 1)
        return value.split(',').map(item => {
            item = item.trim()
            if (item !== '' && getCopyWithBlankStrings(item).trim() === '') {
                return item.substring(1, item.length - 1)
            }
            return item
        })
    }
    return value
}
