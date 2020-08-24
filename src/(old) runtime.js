const Nothing = undefined;

class Closure {
    constructor(id, caps, locals) {
        this.id = id;
        this.caps = caps;
        this.locals = locals;
    }
}

class Reference {
    constructor(init_value) {
        this.value = init_value;
    }
    get() {
        return this.value;
    }
    set(new_value) {
        this.value = new_value;
    }
}

class Type extends Map {
    constructor(name) {
        this.name = name;
    }
}

Type.Type        = new Type("Type");
Type.NothingType = new Type("NothingType");
Type.Boolean     = new Type("Boolean");
Type.Number      = new Type("Number");
Type.String      = new Type("String");
Type.List        = new Type("List");
Type.Map         = new Type("Map");
Type.Function    = new Type("Function");

function rt_equal(val1, val2, visited = new Map(), depth = 0) {
    // TODO verify this alrogirthm actually works
    if (val1 === val2) {
        return true;
    }
    if (typeof val1 !== "object" && typeof val2 !== "object") {
        return false;
    }
    // Safe to compare constructors now
    if (val1.constructor !== val2.constructor) {
        return false;
    }
    // Types, Closures, and Reference compare on identity
    if (
        val1 instanceof Type || 
        val1 instanceof Closure || 
        val1 instanceof Reference
    ) {
        return false;
    }
    // If we have a cyclical reference ensure they point ot the same depth
    if (visited.has(val1)) {
        if (visited.has(val2)) {
            return visited.get(val1) === visited.get(val2);
        }
        return false;
    }
    if (val1 instanceof Array) {
        if (val1.length !== val2.length) {
            return false;
        }
        visited.set(val1, depth);
        visited.set(val2, depth);
        for (let i in val1) {
            if (!equal(val1[i], val2[i], visited, depth + 1)) {
                return false;
            }
        }
        return true;
    }
    if (val1 instanceof Map) {
        if (val1.size !== val2.size) {
            return false;
        }
        visited.set(val1, depth);
        visited.set(val2, depth);
        for (let key of val1.keys()) {
            if (!equal(val1.get(key), val2.get(key))) {
                return false;
            }
            return true;
        }
    }
    assert(false);
}

function rt_in(key, collection) {
    if (collection instanceof Array) {
        return collection.includes(key);
    } 
    if (typeof collection === "string") {
        return collection.includes(key);
    }
    if (collection instanceof Map) {
        return collection.has(key);
    }
    assert(false);
}

function copy(val, visited = new Map()) {
    if (typeof val !== "object") {
        return val;
    }
    if (Object.isFrozen(val)) {
        return val;
    }
    if (visited.has(val)) {
        return val;
    }
    if (val instanceof Closure) {
        return val;
    }
    if (val instanceof Reference) {
        return new Reference(val.get());
    }
    if (val instanceof Array) {
        return [ ...val ];
    }
    if (val instanceof Map) {q
        return new Map(val);
    }
    assert(false);
}

function rt_merge(source, destination) {
    if (typeof source !== "object") {
        return source;
    }

}

function rt_update() {

}

function rt_slice() {

}

function rt_index() {

}

function rt_match() {

}

function rt_type(val) {
    if (val === Nothing) {
        return Type.NothingType;
    }
    if (typeof val === "boolean") {
        return Type.Boolean;
    }
    if (typeof val === "number") {
        return Type.Number;
    }
    if (typeof val === "string") {
        return Type.String;
    }
    if (val instanceof Type) {
        return Type.Type;
    }
    if (val instanceof Array) {
        return Type.List;
    }
    if (val instanceof Map) {
        return Type.Map;
    }
    if (val instanceof Closure) {
        return Type.Function;
    }
    // TODO, what do errors look like in runtime functions?
    // Are parameters typed before hand?
    // Can we recover from actually throwing an error?
    // Do we need to return an object with the pass/fail data
    // Do we need a partner function that checks types beforehand?
    assert(false);
}

module.exports = {
    Closure,
    Reference,
    Type,
};