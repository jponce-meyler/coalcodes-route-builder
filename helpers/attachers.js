export const attachComments = (data, comments, start = 0) => {
    if (!comments) {
        comments = data.comments
    }
    let body = data.body
    if (!data.body) {
        body = data.declaration
    }
    if (!comments || !body) {
        return data
    }
    if (!Array.isArray(body)) {
        body = [body]
    }
    let end = data.start
    body.forEach(item => {
        end = item.start
        for (let i = 0; i < comments.length; i++) {
            if (end < comments[i].start) {
                break;
            }
            if (comments[i].start >= start && comments[i].end <= end) {
                if (!item.leadingComments) {
                    item.leadingComments = []
                }
                item.leadingComments.push(comments[i])
                comments.splice(i, 1)
                i--
            }
        }
        item = attachComments(item, comments, item.start)
        start = item.end
    })

    if (!data.body) {
        data.declaration = body.shift()
    } else if (!Array.isArray(data.body)) {
        data.body = body.shift()
    } else {
        data.body = body
    }
    return data
}

export const attachSource = (sources, contents) => {
    return contents.map((content, index) => {
        return {
            content: content,
            source: sources[index]
        }
    })
}
