import { 
    TokenType, 
    Keywords, 
    Operators,
} from "./Constants.js";
import Parsing from "./Parsing.js";
const { 
    regex, 
    all,
    choice,
    many,
    map,
    must,
} = Parsing;

function map_type(type, parser) {
    return map(function(match, position, stream) {
        const length = stream.position - position;
        return { type, position, length, value: match[0] };
    }, parser);
}

function map_to_int(base, parser) {
    return map(function(match, position, stream) {
        const length = stream.position - position;
        const value = parseInt(match[0].substring(2).replace(/_/g, ""), base);
        return { type: TokenType.Number, length, position, value };
    }, parser);
}

function map_to_float(parser) {
    return map(function(match, position, stream) {
        const length = stream.position - position;
        const value = parseFloat(match[0].replace(/_/g, ""));
        return { type: TokenType.Number, length, position, value };
    }, parser);
}

const doc = map_type(
    TokenType.Doc, 
    regex(/^((---(.|\s)*?---|--.*))(?=\s*let\b)/),
);

const comment = map_type(
    TokenType.Comment,
    regex(/^(---(.|\s)*?---|--.*)/),
);

const explicit_terminator = map_type(
    TokenType.ExplicitTerminator,
    regex(/^\s*;[\s;]*/),
);

const implicit_terminator = map_type(
    TokenType.ImplicitTerminator,
    regex(/^[^\S\n]*\n\s*/),
);

const whitespace = map_type(
    TokenType.Whitespace,
    regex(/^\s+/),   
);

const punctuation = map_type(
    TokenType.Punctuation,
    regex(/^(,|\(|\)|\[|\]|\{|\})/),
);

const number = choice(
        map_to_int(0b10, regex(/^[+-]?0[bB][01][01_]*/)),
        map_to_int(0o10, regex(/^[+-]?0[oO][0-7][0-7_]*/)),
        map_to_int(0x10, regex(/^[+-]?0[xX][\da-fA-F][\da-fA-F_]*/)),
        map_to_float(regex(/^[+-]?((\d[\d_]*)?\.)?\d[\d_]*([eE][+-]?\d[\d_]*)?/)),
);

const string = choice(
    map(function(match, position, stream) {
        const length = stream.position - position;
        return { type: TokenType.String, position, length, value: JSON.parse(match[0]) }
    }, regex(/^"(\\.|[^\\"])*?"/)),
    map(function(match, position, stream) {
        const length = stream.position - position;
        return { type: TokenType.String, position, length, value: match[1].replace(/\\'/g, "'") }
    }, regex(/^'((\\'|[^'])*)'/)),
);

const symbol = map_type(
    TokenType.Symbol,
    regex(/^\.\w+\??/),
);

const identifier = map(function(match, position, stream) {
    const length = stream.position - position;
    const value = match[0];
    if (value === "Nothing") {
        return { type: TokenType.Nothing, position, length, value: undefined };
    }
    if (value === "True") {
        return { type: TokenType.Boolean, position, length, value: true };
    }
    if (value=== "False") {
        return { type: TokenType.Boolean, position, length, value: false };
    }
    if (value === "Infinity") {
        return { type: TokenType.Number, position, length, value: Infinity };
    }
    if (value === "NaN") {
        return { type: TokenType.Number, position, length, value: NaN };
    }
    if (Operators.includes(value)) {
        return { type: TokenType.Operator, position, length, value };
    }
    if (Keywords.includes(value)) {
        return { type: TokenType.Keyword, position, length, value };
    }
    return { type: TokenType.Identifier, position, length, value };
}, regex(/^\w+\??/));

const operator = map_type(
    TokenType.Operator,
    regex(/^(==|\/=|=>|->|=|<=|<|>=|>|\+|-|\*|\/|\^|\.\.\.|\.\.|:)/),
);

const token = choice(
    doc,
    comment,
    explicit_terminator,
    implicit_terminator,
    whitespace,
    punctuation,
    number,
    string,
    symbol,
    identifier,
    operator,
);

const lex = must(all(many(token)));

export default {
    lex,
};