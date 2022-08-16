
export default (data, parent) => {
    let routes = []
    if (data.type === 'ExportNamedDeclaration') {
        switch (data.declaration.type) {
            case 'ClassDeclaration': {
                if (data.leadingComments) {
                    let comment = data.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
                    parent = extractRouteFromComment(comment, parent)
                    routes = [...routes, ...parseRoutesFromData(data.declaration.body, extractRouteFromComment(comment, parent))]
                }
            }
                break;
            case 'VariableDeclaration':
            case 'FunctionDeclaration': {
                if (data.leadingComments) {
                    let comment = data.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
                    let route = extractRouteFromComment(comment, parent)
                    routes.push(route)
                }
            }
                break;
            default: {
                console.log('Unknown type', data.declaration.type)
            }
        }
    } else if (data.type === 'MethodDefinition') {
        if (data.leadingComments) {
            let comment = data.leadingComments.reduce((prev, curr) => prev + ' ' + curr.value, '')
            let route = extractRouteFromComment(comment, parent)
            routes.push(route)
        }
    } else if (data.body) {
        if (!Array.isArray(data.body)) {
            data.body = [data.body]
        }
        data.body.forEach(item => {
            routes = [...routes, ...parseRoutesFromData(item, parent)]
        })
    }
    return routes
}


export const extractRouteFromComment = (comment, parent) => {
    let route = {
        path: '',
        method: '',
        role: '',
        parent: parent
    }
    let params = extractRouteContent(comment)
    params.forEach(param => {
        switch (param.arg) {
            case 'path':
                route.path = param.value;
                break;
            case 'method':
                route.method = param.value;
                break;
            case 'role':
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
    copy = ''.padEnd(content.index + content[0].length, ' ') + copy.substring(content.index + content[0].length, copy.indexOf(')'))


    let args = [...copy.matchAll(/(,|[a-z0-9_]+=)/gmi)]
    let lastIndex = 0
    let lastArg = ''
    let results = args.map(arg => {
        if (arg[0] === ',') {
            return {arg: lastArg, value: comment.substring(lastIndex, arg.index)}
        }
        lastArg = arg[0].substring(0, arg[0].length - 1)
        lastIndex = arg.index + arg[0].length
    }).filter(arg => arg)
    results.push({arg: lastArg, value: comment.substring(lastIndex, copy.length)})
    results = results.map(result => {
        result.value = parseArgValue(result.value)
        return result
    }).filter(result => result.value && result.value.length > 0)
    return results
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
