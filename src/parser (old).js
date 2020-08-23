const { NodeType, Operator } = require("./node");
const { 
    Parser,
    chain,
    pass,
    fail,
    choice,
    many,
    many1,
    sequence,
    named_sequence,
    alternate,
    alternate1,
    separate,
    separate1,
    maybe,
    map,
    map_get,
    map_replace,
    filter,
    must,
    Context,
    peek,
    pop,
} = require("./parsing");

function first([ first ]) { return first; }

function second([ _, second ]) { return second; }

function token(pattern, skip_newlines=true) {
    return Parser(function(ctx) {
        let token = pop(ctx);
        if (skip_newlines) {
            while (token.value === "\n") {
                token = pop(ctx);
            }
        }
        if (pattern.type && pattern.type !== token.type) {
            return false;
        }
        if (pattern.value && pattern.value !== token.value) {
            return false;
        }
        return token;
    });
}

function type(type, skip_newlines=true) {
    return token({ type }, skip_newlines);
}

function value(type, skip_newlines=true) {
    return token({ value }, skip_newlines);
}

function comma_separate(parser) {
    return map(first, alternate(parser, value(",")));
}

function map_type(type, parser) {
    return map(function(result) {
        return { type, ...result };
    }, parser);
}

function map_name(name, parser) {
    return map(function(result) {
        return { [name]: result };
    }, parser);
}

function binary_operator(operator_parser, operand_parser) {
    function map_operator([ 
        [ first_operand, ...rest_operands ], 
        [ first_operator, ...rest_operators ],
    ]) {
        if (rest_operands.length === 0) {
            return first_operand;
        }
        return {
            type: NodeType.BinaryOperator,
            operator: first_operator,
            left_operand: first_operand,
            right_operand: map_operator([ rest_operands, rest_operators ]),
        }
    }
    map(map_operator, alternate1(operand_parser, operator_parser));
}

const _ = undefined;

const module_ = map_type(NodeType.Module, named_sequence(
    [ "statements", statements ],
    [ _, many(type(NodeType.Terminator)) ],
    [ _, type(NodeType.Eof) ],
));

const statements = map(first, separate(
    statement, 
    type(NodeType.Terminator, skip_newlines=false),
));

const statement = choice(
    declaration,
    return_statement,
    throw_statement,
    assignment,
    expression,
);

const declaration = map_type(NodeType.Declaration, named_sequence(
    [ "doc", maybe(type(NodeType.Doc)) ],
    [ _, value("var") ],
    [ "pattern", must(pattern) ],
    [ _, must(value("=")) ],
    [ "expression", must(expression) ],
));

const pattern = map_type(NodeType.Pattern, map_name("binding", 
    map(first, separate1(
        binding,
        value("as"),
    ))
));

const binding = choice(
    range_binding,
    spread_binding,
    list_binding,
    map_binding,
    simple_literal,
    type(NodeType.Identifier),
);

const range_binding = map_type(NodeType.BinaryOperator, named_sequence(
    [ "start", type(NodeType.Number) ],
    [ "operator", map_replace(Operator.Range, value("..")) ],
    [ "end", must(type(NodeType.Number)) ],
));

const spread_binding = map_type(NodeType.UnaryOperator, named_sequence(
    [ "operator", map_replace(Operator.Spread, value("...")) ],
    [ "operand", maybe(type(NodeType.Identifier)) ],
));

const list_binding = map_type(NodeType.ListExpression, named_sequence(
    [ _, value("List") ],
    [ _, must(value("[")) ],
    [ "items", must(patterns) ],
    [ _, must(value("]")) ],
));

const patterns = comma_separate(pattern);

const map_binding = map_type(NodeType.MapExpression, named_sequence(
    [ _, value("Map") ],
    [ _, must(value("[")) ],
    [ "pairs", must(pattern_pairs) ],
    [ _, must(value("]")) ],
));

const pattern_pairs = comma_separate(pattern_pair);

const pattern_pair = map_type(NodeType.Pair, choice(
    named_sequence(
        [ "key", type(NodeType.Identifier) ],
        [ _, value(":") ],
        [ "value", pattern ],
    ),
    named_sequence(
        [ "key", type(NodeType.Identifier) ],
    ),
    named_sequence(
        [ _, value("[") ],
        [ "key", must(pattern) ],
        [ _, must(value("]")) ],
        [ _, must(value(":")) ],
        [ "value", must(pattern) ],
    ),
));

const simple_literal = choice(
    type(NodeType.String),
    type(NodeType.Number),
    type(NodeType.Boolean),
    type(NodeType.Nothing),
);

const return_statement = map_type(NodeType.Return, named_sequence(
    [ _, value("return") ],
    [ "expression", must(expression) ],
));

const throw_statement = map_type(NodeType.Throw, named_sequence(
    [ _, value("throw") ],
    [ "expression", must(expression) ],
));

const assignment = map_type(NodeType.Assignment, named_sequence(
    [ "target", type(NodeType.Identifier) ],
    [ _, value("=") ],
    [ "expression", must(expression) ],
));

const expression = choice(
    control_expression,
    primary_expression,
);

const control_expression = choice(
    if_expression,
    do_expression,
    while_expression,
    match_expression,
    for_expression,
    try_expression,
);

const if_expression = map_type(NodeType.IfExpression, choice(
    named_sequence(
        [ _, value("if") ],
        [ "condition", must(primary_expression) ],
        [ _, must(value("then")) ],
        [ "then_block", must(block) ],
        [ _, value("else") ],
        [ "else_block", must(choice(block, if_expression)) ],
    ),
    named_sequence(
        [ _, value("if") ],
        [ "condition", must(primary_expression) ],
        [ _, must(value("then")) ],
        [ "then_block", must(block) ],
    ),
));

const do_expression = map_type(NodeType.DoExpression, named_sequence(
    [ _, value("do") ],
    [ "block", must(block) ],
));

const while_expression = map_type(NodeType.WhileExpression, named_sequence(
    [ _, value("while") ],
    [ "condition", must(primary_expression) ],
    [ _, value("do") ],
    [ "block", block ],
));

const match_expression = map_type(NodeType.MatchExpression, choice(
    named_sequence(
        [ _. value("match") ],
        [ "expression", maybe(map_get(0, sequence(
            primary_expression,
            must(value("with")),
        ))) ],
        [ "cases", must(cases_block) ],
    ),
));

const cases = map_get(1, sequence(
    value("{"),
    comma_separate(case_),
    value("}"),
));

const case_ = map_type(NodeType.Case, choice(
    named_sequence(
        [ "patterns", patterns ],
        [ "if_condition", maybe(map_get(1, sequence(
            value("if"),
            must(primary_expression),
        ))) ],
        [ _, must(value("=>")) ],
        [ "statement", must(statement) ],
    ),
    named_sequence(
        [ _, "else" ],
        [ _, must(value("=>")) ],
        [ "statement", must(statement) ],
    ),
));

const for_expression = map_type(NodeType.ForExpression, named_sequence(
    [ _, value("for") ],
    [ "pattern", pattern ],
    [ _, must(value("in")) ],
    [ "expression", must(primary_expression) ],
    [ "if_condition", maybe(map_get(1, sequence(
        value("if"),
        must(primary_expression),
    ))) ],
    [ "while_condition", maybe(map_get(1, sequence(
        value("while"),
        must(primary_expression),
    ))) ],
    [ _, must(value("do")) ],
    [ "block", must(block) ],
));

const try_expression = map_type(NodeType.TryExpression, choice(
    named_sequence(
        [ _, value("try") ],
        [ "block", must(block) ],
        [ _, value("catch") ],
        [ "catch_cases", must(choice(cases, sequennce(case_block))) ],
        [ "finally_block", maybe(map_get(1, sequence(
            value("finally"),
            must(block),
        ))) ],
    ),
    named_sequence(
        [ _, value("try") ],
        [ "block", must(block) ],
        [ _, must(value("finally") ) ],
        [ "finally_block", must(block) ],
    ),
));

const case_block = map_type(NodeType.Case, choice(
    named_sequence(
        [ _, value("{") ],
        [ "patternns", patterns ],
        [ "if_condition", maybe(map_get(1, sequence(
            value("if"),
            must(primary_expression),
        ))) ],
        [ _, value("->") ],
        [ "statements", statements ],
        [ _, must(value("}")) ],
    ),
    named_sequence(
        [ _, value("{") ],
        [ "statements", statements ],
        [ _, value("}") ],
    )
));

const block = map_type(NodeType.Block, named_sequence(
    [ _, value("{") ],
    [ "statements", statements ],
    [ _, value("}") ],
));

const primary_expression = chocie(
    function_,
    list_literal,
    map_literal,
    or_expression,
);

const function_ = map_type(NodeType.Function, named_sequence(
    [ _, value("Function") ],
    [ "cases", choice(cases, sequence(case_block)) ],
));

const list_literal = map_type(NodeType.ListExpression, named_sequence(
    [ _, value("List") ],
    [ _, value("[") ],
    [ "items", must(expressions) ],
    [ _, must(value("]")) ],
));

const expressions = comma_separate(expression);

const map_literal = map_type(NodeType.MapExpression, named_sequence(
    [ _, value("Map") ],
    [ _, value("[") ],
    [ "pairs", must(pairs) ],
    [ _, value("]") ],
));

const pairs = comma_separate(pair);

const pair = map_type(NodeType.Pair, choice(
    named_sequence(
        [ _, value("[") ],
        [ "key", must(expression) ],
        [ _, must(value("]")) ],
        [ _, must(value(":")) ],
        [ "value", must(expression) ],
    ),
    named_sequence(
        [ "key", expression ],
        [ "value", maybe(map_get(1, sequence(
            value(":"),
            must(expression),
        ))) ],
    ),
    named_sequence(
        [ _, value("...") ],
        [ "spread", must(operator_free_expression) ],
    ),
));

const or_expression = binary_operator(
    map_replace(Operator.Or, value("or")),
    and_expression,
);

const and_expression = binary_operator(
    map_replace(Operator.And, value("and")),
    relational_expression,
);

const relational_expression = binary_operator(
    relational_operator,
    additive_expression,
);

const relational_operator = choice(
    map_replace(Operator.NotEqual, value("/=")),
    map_replace(Operator.Equal, value("==")),
    map_replace(Operator.IsNot, sequence(value("is"), value("not"))),
    map_replace(Operator.Is, value("is")),
    map_replace(Operator.LessThanOrEqualTo, value("<=")),
    map_replace(Operator.LessThan, value("<")),
    map_replace(Operator.GreaterThanOrEqualTo, value(">=")),
    map_replace(Operator.GreaterThan, value(">")),
    map_replace(Operator.NotIn, sequence(value("not"), value("in"))),
    map_replace(Operator.In, value("in")),
);

const additive_expression = binary_operator(
    additive_operator,
    multiplicative_expression,
);

const additive_operator = choice(
    map_replace(Operator.Add, value("+")),
    map_replace(Operator.Subtract, value("-")),
);

const multiplicative_expression = binary_operator(
    multiplicative_operator,
    exponential_expression,
);

const multiplicative_operator = choice(
    map_replace(Operator.Multiply, value("*")),
    map_replace(Operator.Divide, "/"),
);

const exponential_expression = binary_operator(
    exponential_operator,
    unary_expression,
);

const exponential_operator = choice(
    map_replace(Operator.Exponentiate, value("^")),
    map_replace(Operator.Range, value("..")),
);

const unary_expression = choice(
    map_type(NodeType.UnaryOperator, named_sequence(
        [ "operator", unary_operator ],
        [ "operand", must(operator_free_expression) ],
    )),
    operator_free_expression,
);

const unary_operator = choice(
    map_replace(Operator.Not, value("not")),
    map_replace(Operator.Positive, value("+")),
    map_replace(Operator.Negative, value("-")),
    map_replace(Operator.Spread, value("...")),
);

// TODO Yikes
const operator_free_expression = sequence(
    simple_expression,
    many(sequence(
        maybe(call),
        maybe(access),
    )),
);

const simple_expression = choice(
    map(second, sequence(
        value("("),
        must(expression),
        must(value(")")),
    )),
    simple_literal,
);

const call = map_type(NodeType.Call, named_sequence(
    [ _, value("(") ],
    [ "arguments", must(expressions) ],
    [ _, must(value(")")) ],
));

const access = map_type(NodeType.Access, choice(
    named_sequence(
        [ _, value(".") ],
        [ "key", must(type(NodeType.Identifier)) ],
    ),
    nemed_sequence(
        [ _, value("[") ],
        [ "key", must(expression) ],
        [ must(value("]")) ],
    ),
));

function parse(tokens) {
    return module(Context(tokens));
}

module.exports = { parse };