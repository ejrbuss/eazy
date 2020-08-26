const { 
    NodeType,
    Operator,
} = require("./Constants");
const {
    Stream,
    Parser, 
    pass,
    next,
    lazy,
    all,
    many,
    sequence,
    alternate,
    separate1,
    choice,
    maybe,
    must,
    map,
    map_to,
    map_to_nth,
    map_into,
    named_sequence,
} = require("./Parsing");

function token_of_type(type) {
    return Parser(function(stream) {
        let next_token = next(stream);
        if (type !== NodeType.ImplicitTerminator) {
            while (next_token.type === NodeType.ImplicitTerminator) {
                next_token = next(stream);
            }
        }
        if (next_token.type === type) {
            return next_token;
        }
        return false;
    });
}

function token_with_value(value) {
    return Parser(function(stream) {
        let next_token = next(stream);
        while (next_token.type === NodeType.ImplicitTerminator) {
            next_token = next(stream);
        }
        if (next_token.value === value) {
            return next_token;
        }
        return false;
    });
}

function map_binary_operator(parser) {
    return map(function(result) {
        const [ blocks, operators ] = result;
        result = blocks.pop();
        while (blocks.length > 0) {
            result = { 
                type: NodeType.BinaryOperator, 
                operator: operators.pop(),
                left_operand: blocks.pop(),
                right_operand: result,
            };
        }
        return result;
    }, parser);
}

const terminator = choice(
    token_of_type(NodeType.ImplicitTerminator),
    token_of_type(NodeType.ExplicitTerminator),
);

const simple_literal = choice(
    token_of_type(NodeType.Identifier),
    token_of_type(NodeType.Symbol),
    token_of_type(NodeType.String),
    token_of_type(NodeType.Number),
    token_of_type(NodeType.Boolean),
    token_of_type(NodeType.Nothing),
);

const pair = lazy(function() {
    return map_into({ type: NodeType.Pair }, 
        choice(
            named_sequence(
                "key", expression,
                token_with_value("="),
                "value", must(expression),
            ),
            named_sequence(
                token_with_value("..."),
                "spread", must(operator_free_expression),
            ),
            named_sequence(
                "value", token_of_type(NodeType.Identifier)
            ),
        ),
    );
});

const pairs = map_to_nth(0, 
    alternate(
        pair, 
        token_with_value(","),
    ),
);

const map_literal = map_into({ type: NodeType.MapExpression }, 
    named_sequence(
        token_with_value("Map"),
        token_with_value("["),
        "pairs", must(pairs),
        must(token_with_value("]")),
    ),
);

const expressions = lazy(function() {
    return map_to_nth(0,
        alternate(expression, token_with_value(",")),
    );
});

const list_literal = map_into({ type: NodeType.ListExpression }, 
    named_sequence(
        token_with_value("List"),
        token_with_value("["),
        "items", must(expressions),
        must(token_with_value("]")),
    ),
);

const function_ = lazy(function() {
    return map_into({ type: NodeType.Function }, 
        named_sequence(
            token_with_value("Function"),
            "cases", choice(cases, case_block),
        ),
    );
});

const simple_expression = lazy(function() {
    return choice(
        map_to_nth(1,
            sequence(
                token_with_value("("),
                expression,
                token_with_value(")"),
            ),
        ),
        function_,
        list_literal,
        map_literal,
        simple_literal,
    );
});

const access = lazy(function() {
    return map_into({ type: NodeType.Access }, 
        choice(
            named_sequence(
                "key", token_of_type(NodeType.Symbol),
            ),
            named_sequence(
                token_with_value("["),
                "key", expression,
                token_with_value("]"),
            ),
        ),
    );
});

const call = map_into({ type: NodeType.Call }, 
    named_sequence(
        token_with_value("("),
        "arguments", expressions,
        token_with_value(")"),
    ),
);

const call_or_access = choice(
    call,
    access,
);

const operator_free_expression = map(function(result) {
    const [ expression, calls_or_accesses ] = result;
    result = expression;
    while (calls_or_accesses.length > 0) {
        const call_or_access = calls_or_accesses.shift();
        call_or_access.value = result;
        result = call_or_access;
    }
    return result;
}, sequence(
    simple_expression,
    many(call_or_access),
));

const unary_operator = choice(
    map_to(Operator.Not, token_with_value("not")),
    map_to(Operator.Positive, token_with_value("+")),
    map_to(Operator.Negative, token_with_value("-")),
    map_to(Operator.Spread, token_with_value("...")),
);

const unary_expression = choice(
    map_into({ type: NodeType.UnaryOperator },
        named_sequence(
            "operator", unary_operator,
            "operand",  must(operator_free_expression),
        ),
    ),
    operator_free_expression,
);

const exponential_operator = choice(
    map_to(Operator.Exponentiate, token_with_value("^")),
    map_to(Operator.Range, token_with_value("..")),
);

const exponential_expression = map_binary_operator(
    separate1(
        unary_expression,
        exponential_operator,
    ),
);

const multiplicative_operator = choice(
    map_to(Operator.Multiply, token_with_value("*")),
    map_to(Operator.Divide, token_with_value("/")),
);

const multiplicative_expression = map_binary_operator(
    separate1(
        exponential_expression, 
        multiplicative_operator,
    ),
);

const additive_operator = choice(
    map_to(Operator.Add, token_with_value("+")),
    map_to(Operator.Subtract, token_with_value("-")),
);

const additive_expression = map_binary_operator(
    separate1(
        multiplicative_expression, 
        additive_operator,
    ),
);

const relational_operator = choice(
    map_to(Operator.NotEqual, token_with_value("/=")),
    map_to(Operator.Equal, token_with_value("==")),
    map_to(Operator.IsNot, sequence(token_with_value("is"), token_with_value("not"))),
    map_to(Operator.Is, token_with_value("is")),
    map_to(Operator.LessThanOrEqualTo, token_with_value("<=")),
    map_to(Operator.LessThan, token_with_value("<")),
    map_to(Operator.GreaterThanOrEqualTo, token_with_value(">=")),
    map_to(Operator.GreaterThan, token_with_value(">")),
    map_to(Operator.NotIn, sequence(token_with_value("not"), token_with_value("in"))),
    map_to(Operator.In, token_with_value("in")),
);

const relational_expression = map_binary_operator(
    separate1(
        additive_expression,
        relational_operator,
    ),
);

const and_expression = map_binary_operator(
    separate1(
        relational_expression,
        map_to(Operator.And, token_with_value("and")),
    ),
);

const or_expression = map_binary_operator(
    separate1(
        and_expression,
        map_to(Operator.Or, token_with_value("or")),
    ),
);

const primary_expression = or_expression;

const block = lazy(function() {
    return map_to_nth(1,
        sequence(
            token_with_value("{"),
            statements,
            token_with_value("}"),
        ),
    );
});

const case_block = lazy(function() {
    return sequence(map_into({ type: NodeType.Case }, 
        choice(
            named_sequence(
                token_with_value("{"),
                "patterns", patterns,
                "condition", maybe(map_to_nth(1,
                    sequence(
                        token_with_value("if"),
                        must(primary_expression),
                    ),
                )),
                token_with_value("->"),
                "block", must(statements),
                must(token_with_value("}")),
            ),
            named_sequence(
                "patterns", map_to([], pass),
                token_with_value("{"),
                "block", must(statements),
                token_with_value("}"),
            ),
        ),
    ));
});

const finally_ = lazy(function() {
    return map_to_nth(1,
        sequence(
            token_with_value("finally"),
            block,
        ),
    );
});

const catch_ = lazy(function() {
    return map_to_nth(1, 
        sequence(
            token_with_value("catch"),
            choice(
                cases,
                case_block,
            )
        ),
    );
});

const try_expression = map_into({ type: NodeType.TryExpression },
    choice(
        named_sequence(
            token_with_value("try"),
            "block", block,
            "catch_cases", catch_,
            "finally_block", maybe(finally_),
        ),
        named_sequence(
            token_with_value("try"),
            "block", block,
            "finally_block", finally_,
        ),
    ),
);

const for_expression = lazy(function() {
    return map_into({ type: NodeType.ForExpression }, 
        named_sequence(
            token_with_value("for"),
            "pattern", must(pattern),
            must(token_with_value("in")),
            "expression", must(primary_expression),
            "if_condition", maybe(map_to_nth(1,
                sequence(
                    token_with_value("if"),
                    must(primary_expression),
                ),
            )),
            "while_condition", maybe(map_to_nth(1,
                sequence(
                    token_with_value("while"),
                    must(primary_expression),
                ),
            )),
            must(token_with_value("do")),
            "block", must(block),
        ),
    );
});

const else_case = lazy(function() {
    return map_into({ type: NodeType.ElseCase },
        named_sequence(
            token_with_value("else"),
            must(token_with_value("=>")),
            "block", sequence(must(statement)),
        ),
    );
});

const primary_case = lazy(function() {
    return map_into({ type: NodeType.Case },
        named_sequence(
            "patterns", patterns,
            "condition", maybe(map_to_nth(1,
                sequence(
                    token_with_value("if"),
                    must(expression),
            ))),
            token_with_value("=>"),
           "block", must(sequence(statement)),
        ),
    );
});

const case_ = choice(
    primary_case,
    else_case,
);

const cases = map_to_nth(1, 
    sequence(
        token_with_value("{"),
        map_to_nth(0,
            alternate(
                case_, 
                token_with_value(","),
            ),
        ),
        token_with_value("}"),
    ),
);

const match_expression = map_into({ type: NodeType.MatchExpression }, 
    choice(
        named_sequence(
            token_with_value("match"),
            "cases", cases,
        ),
        named_sequence(
            token_with_value("match"),
            "expression", must(primary_expression),
            must(token_with_value("with")),
            "cases", must(cases),
        )
    ),
);

const while_expression = map_into({ type: NodeType.WhileExpression },
    named_sequence(
        token_with_value("while"),
        "condition", must(primary_expression), 
        must(token_with_value("do")),
        "block", must(block),
    ),
);

const do_expression = map_into({ type: NodeType.DoExpression }, 
    named_sequence(
        token_with_value("do"),
        "block", must(block),
    ),
);

const if_continuation = lazy(function() {
    return choice(
        block,
        sequence(if_expression),
    );
});

const if_expression = map_into({ type: NodeType.IfExpression }, 
    named_sequence(
        token_with_value("if"),
        "condition", must(primary_expression),
        must(token_with_value("then")),
        "then_block", must(block),
        "else_block", maybe(map_to_nth(1,
            sequence(
                token_with_value("else"),
                must(if_continuation),
            ),
        )),
    ),
);

const control_expression = choice(
    if_expression,
    do_expression,
    while_expression,
    match_expression,
    for_expression,
    try_expression,
);

const expression = choice(
    control_expression,
    primary_expression,
);

const assignment = map_into({ type: NodeType.Assignment }, 
    named_sequence(
        "target", token_of_type(NodeType.Identifier),
        "accesses", many(access),
        token_with_value("="),
        "expression", must(expression),
    ),
);

const throw_statement = map_into({ type: NodeType.Throw },
    named_sequence(
        token_with_value("throw"),
        "expression", must(expression),
    ),
);

const return_statement = map_into({ type: NodeType.Return }, 
    named_sequence(
        token_with_value("return"),
        "expression", must(expression),
    ),
);

const pattern_pair = lazy(function() {
    return map_into({ type: NodeType.Pair }, 
        choice(
            named_sequence(
                "key", pattern,
                token_with_value("="),
                "value", must(pattern),
            ),
            named_sequence(
                "value", token_of_type(NodeType.Identifier),
            ),
        ),
    );
});

const pattern_pairs = map_to_nth(0,
    alternate(
        pattern_pair,
        token_with_value(","),
    ),
);

const map_binding = map_into({ type: NodeType.MapExpression }, 
    named_sequence(
        token_with_value("Map"),
        must(token_with_value("[")),
        "pairs", must(pattern_pairs),
        must(token_with_value("]")),
    ),
);

const patterns = lazy(function() {
    return map_to_nth(0, 
        alternate(
            pattern, 
            token_with_value(","),
        ),
    );
});

const list_binding = map_into({ type: NodeType.ListExpression },
    named_sequence(
        token_with_value("List"),
        must(token_with_value("[")),
        "items", must(patterns),
        must(token_with_value("]")),
    ),
);

const spread_binding = map_into({ type: NodeType.UnaryOperator },
    named_sequence(
        "operator", map_to(Operator.Spread, token_with_value("...")),
        "operand", maybe(token_of_type(NodeType.Identifier)), 
    ),
);

const range_binding = map_into({ type: NodeType.BinaryOperator }, 
    named_sequence(
        "left_operand", token_of_type(NodeType.Number),
        "operator", map_to(Operator.Range, token_with_value("..")),
        "right_operand", must(token_of_type(NodeType.Number)),
    ),
);

const binding = choice(
    range_binding,
    spread_binding,
    list_binding,
    map_binding,
    simple_literal,
);

const pattern = map_into({ type: NodeType.Pattern },
    named_sequence(
        "bindings", map_to_nth(0, 
            separate1(
                binding,
                token_with_value("as"), 
            ),
        ),
    ),
);

const declaration = map_into({ type: NodeType.Declaration }, 
    named_sequence(
        "doc", maybe(token_of_type(NodeType.Doc)),
        token_with_value("let"),
        "pattern", must(pattern),
        must(token_with_value("=")),
        "expression", must(expression),
    ),
);

const statement = choice(
    declaration,
    return_statement,
    throw_statement,
    assignment,
    expression,
);

const statements = map_to_nth(0, 
    alternate(statement, terminator)
);

const module_ = must(all(map_into({ type: NodeType.Module }, 
    named_sequence(
        "block", statements,
    ),
)));

function parse(tokens) {
    tokens = tokens.filter(function(token) {
        if (token.type === NodeType.Whitespace) {
            return false;
        }
        if (token.type === NodeType.Comment) {
            return false;
        }
        return true;
    });
    return module_(Stream(tokens));
}

module.exports = { 
    parse,
};