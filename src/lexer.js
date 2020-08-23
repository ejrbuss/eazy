const { 
    NodeType, 
    Builtins, 
    Keywords, 
    Operators,
} = require("./constants");
const { 
    regex, 
    all,
    choice,
    many,
    map,
    must,
} = require("./parsing");

function map_type(type, parser) {
    return map(function(match, position) {
        return { type, position, value: match[0] };
    }, parser);
}

function map_to_int(base, parser) {
    return map(function(match, position) {
        const value = parseInt(match[0].substring(2).replace(/_/g, ""), base);
        return { type: NodeType.Number, position, value };
    }, parser);
}

function map_to_float(parser) {
    return map(function(match, position) {
        const value = parseFloat(match[0].replace(/_/g, ""));
        return { type: NodeType.Number, position, value };
    }, parser);
}

const doc = map_type(
    NodeType.Doc, 
    regex(/^((---(.|\s)*?---|--.*))(?=\s*let\b)/),
);

const comment = map_type(
    NodeType.Comment,
    regex(/^(---(.|\s)*?---|--.*)/),
);

const explicit_terminator = map_type(
    NodeType.ExplicitTerminator,
    regex(/^\s*;[\s;]*/),
);

const implicit_terminator = map_type(
    NodeType.ImplicitTerminator,
    regex(/^[^\S\n]*\n\s*/),
);

const whitespace = map_type(
    NodeType.Whitespace,
    regex(/^\s+/),   
);

const punctuation = map_type(
    NodeType.Punctuation,
    regex(/^(,|\(|\)|\[|\]|\{|\})/),
);

const operator = map_type(
    NodeType.Operator,
    regex(/^(==|\/=|=>|->|=|<=|<|>=|>|\+|-|\*|\/|\.\.\.|\.\.)/),
);

const number = choice(
        map_to_int(0b10, regex(/^0[bB][01][01_]*/)),
        map_to_int(0o10, regex(/^0[oO][0-7][0-7_]*/)),
        map_to_int(0x10, regex(/^0[xX][\da-fA-F][\da-fA-F_]*/)),
        map_to_float(regex(/^((\d[\d_]*)?\.)?\d[\d_]*([eE][+-]?\d[\d_]*)?/)),
);

const string = choice(
    map(function(match, position) {
        return { type: NodeType.String, position, value: JSON.parse(match[0]) }
    }, regex(/^"(\\.|[^\\"])*?"/)),
    map(function(match, position) {
        return { type: NodeType.String, position, value: match[1].replace(/\\'/g, "'") }
    }, regex(/^'((\\'|[^'])*)'/)),
);

const symbol = map_type(
    NodeType.Symbol,
    regex(/^\.\w+\??/),
);

const identifier = map(function(match, position) {
    const value = match[0];
    if (value === "Nothing") {
        return { type: NodeType.Nothing, position, value: undefined };
    }
    if (value === "True") {
        return { type: NodeType.Boolean, position, value: true };
    }
    if (value=== "False") {
        return { type: NodeType.Boolean, position, value: false };
    }
    if (value === "Infinity") {
        return { type: NodeType.Number, position, value: Infinity };
    }
    if (value === "NaN") {
        return { type: NodeType.Number, position, value: NaN };
    }
    if (Operators.includes(value)) {
        return { type: NodeType.Operator, position, value };
    }
    if (Keywords.includes(value)) {
        return { type: NodeType.Keyword, position, value };
    }
    if (Builtins.includes(value)) {
        return { type: NodeType.Builtin, position, value };
    }
    return { type: NodeType.Identifier, position, value };
}, regex(/^\w+\??/));

const token = choice(
    doc,
    comment,
    explicit_terminator,
    implicit_terminator,
    whitespace,
    punctuation,
    operator,
    number,
    string,
    symbol,
    identifier,
);

const lex = must(all(many(token)));

module.exports = {
    lex,
};