export default class Route {
    path = ''
    method = 'GET'
    role = false
    file = ''
    action = ''
    parent = null
    children = []

    constructor({path, method, role, file, action, parent, children}) {
        if (path) { this.path = path }
        if (method) { this.method = method }
        if (role) { this.role = role }
        if (file) { this.file = file }
        if (action) { this.action = action }
        if (parent) { this.parent = parent }
        if (children) { this.children = children }
    }

    addChild(child) {
        this.children.push(child)
    }

    flatRoute() {
        let route = this.toObject(true)
        let parent = route.parent
        route.path = parent.path + route.path
        return route
    }

    toObject(simple = false) {
        let obj = {
            path: this.path,
            method: this.method,
            role: this.role,
            file: this.file,
            action: this.action,
        }
        if (!simple) {
            obj.parent = this.parent
            obj.children = this.children
        }
        return obj
    }
}
