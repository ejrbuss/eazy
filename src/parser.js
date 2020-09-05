const { NodeType, Builtin, TokenType } = require("./Node");
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
    map_ctx_to,
    separate,
    many1,
} = require("./Parsing");
const { ErrorType } = require("./ErrorHandling");

function token_of_type(type) {
    return Parser(function(stream, ctx) {
        let next_token = next(stream);
        if (ctx.skip_implicit_terminators) {
            while (next_token.type == TokenType.ImplicitTerminator) {
                next_token = next(stream);
            }
        }
        if (next_token.type === type) {
            return next_token;
        }
        stream.error_position = next_token.position;
        return false;
    });
}

function token_with_value(value) {
    return Parser(function(stream, ctx) {
        let next_token = next(stream);
        if (ctx.skip_implicit_terminators) {
            while (next_token.type == TokenType.ImplicitTerminator) {
                next_token = next(stream);
            }
        }
        if (next_token.value === value) {
            return next_token;
        }
        stream.error_position = next_token.position;
        return false;
    });
}

function map_ctx_skip_implicit_terminators(parser) {
    return map_ctx_to({ skip_implicit_terminators: true }, parser);
}

function map_ctx_reset(parser) {
    return map_ctx_to({}, parser);
}

function must_token_with_value(value) {
    return must(token_with_value(value), {
        type: ErrorType.ExpectedToken,
        expected_value: value,
    });
}

function must_token_of_type(type) {
    return must(token_of_type(type), {
        type: ErrorType.ExpectedToken,
        expected_type: type,
    });
}

function map_binary_builtin(parser) {
    return map(function(result) {
        const [ left_operand, builtin, right_operand ] = result;
        return {
            type: NodeType.Builtin,
            builtin,
            arguments: [ left_operand, right_operand ],
        }
    }, parser);
}

function map_recursive_binary_builtin(parser) {
    return map(function(result) {
        const [ blocks, operators ] = result;
        result = blocks.pop();
        while (blocks.length > 0) {
            result = { 
                type: NodeType.Builtin, 
                builtin: operators.pop(),
                arguments: [ blocks.pop(), result ],
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

function within_brackets(parser) {
    return map(function(result) {
        const [ _, [ sub_result ] ] = result;
        return sub_result;
    }, sequence(
        token_with_value("{"),
        map_ctx_skip_implicit_terminators(sequence(
            parser,
            token_with_value("}"),
        )),
    ));
}

const box_literal = lazy(function() {
    return map_into({ type: NodeType.BoxExpression }, named_sequence(
        token_with_value("Box"),
        token_with_value("["),
        "value", must(expression, { error: ErrorType.ExpectedProduction, production: "expression" }),
        must_token_with_value("]"),
    ));
});

const spread_item = lazy(function() {
    return map_into({ type: NodeType.Spread },
        named_sequence(
            token_with_value("..."),
            "value", must(operator_free_expression, { error: ErrorType.ExpectedProduction, production: "expression" }),
        )
    );
});

const pair = lazy(function() {
    return map_into({ type: NodeType.Pair }, 
        choice(
            named_sequence(
                "key", expression,
                token_with_value("="),
                "value", must(expression, { error: ErrorType.ExpectedProduction, production: "expression" }),
            ),
            named_sequence(
                "value", token_of_type(NodeType.Identifier)
            ),
        ),
    );
});

const map_item = choice(
    spread_item,
    pair,
);

const map_items = map_to_nth(0, alternate(map_item, token_with_value(",")));

const map_literal = map_into({ type: NodeType.MapExpression }, 
    named_sequence(
        token_with_value("Map"),
        token_with_value("["),
        "pairs", must(map_items, { type: ErrorType.ExpectedProduction, production: "map elements" }),
        must_token_with_value("]"),
    ),
);

const list_item = lazy(function() {
    return choice(
        spread_item,
        expression,
    );
});

const list_items = map_to_nth(0, alternate(list_item, token_with_value(",")));

const list_literal = map_into({ type: NodeType.ListExpression }, 
    named_sequence(
        token_with_value("List"),
        token_with_value("["),
        "items", must(list_items, { type: ErrorType.ExpectedProduction, production: "list elements" }),
        must_token_with_value("]"),
    ),
);

const function_ = lazy(function() {
    return map_into({ type: NodeType.Function }, 
        named_sequence(
            token_with_value("Function"),
            many(terminator),
            "cases", choice(cases, case_block),
        ),
    );
});

const simple_expression = lazy(function() {
    return choice(
        map_to_nth(1,
            sequence(
                token_with_value("("),
                must(expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
                must_token_with_value(")"),
            ),
        ),
        function_,
        list_literal,
        map_literal,
        box_literal,
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

const expressions = lazy(function() {
    return map_to_nth(0,
        alternate(expression, token_with_value(",")),
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
    map_to(Builtin.Not, token_with_value("not")),
    map_to(Builtin.Pos, token_with_value("+")),
    map_to(Builtin.Neg, token_with_value("-")),
);

const unary_expression = choice(
    map_into({ type: NodeType.Builtin },
        named_sequence(
            "builtin", unary_operator,
            "arguments",  map_into([], must(operator_free_expression, { type: ErrorType.ExpectedProduction, production: "expression" })),
        ),
    ),
    operator_free_expression,
);

const exponential_operator = choice(
    map_to(Builtin.Pow, token_with_value("^")),
    map_to(Builtin.Range, token_with_value("..")),
);

const exponential_expression = map_recursive_binary_builtin(
    separate1(
        unary_expression,
        exponential_operator,
    ),
);

const multiplicative_operator = choice(
    map_to(Builtin.Mul, token_with_value("*")),
    map_to(Builtin.Div, token_with_value("/")),
);

const multiplicative_expression = map_recursive_binary_builtin(
    separate1(
        exponential_expression, 
        multiplicative_operator,
    ),
);

const additive_operator = choice(
    map_to(Builtin.Add, token_with_value("+")),
    map_to(Builtin.Sub, token_with_value("-")),
);

const additive_expression = map_recursive_binary_builtin(
    separate1(
        multiplicative_expression, 
        additive_operator,
    ),
);

const relational_operator = choice(
    map_to(Builtin.Noteq, token_with_value("/=")),
    map_to(Builtin.Eq, token_with_value("==")),
    map_to(Builtin.Isnot, sequence(token_with_value("is"), token_with_value("not"))),
    map_to(Builtin.Is, token_with_value("is")),
    map_to(Builtin.Lte, token_with_value("<=")),
    map_to(Builtin.Lt, token_with_value("<")),
    map_to(Builtin.Gte, token_with_value(">=")),
    map_to(Builtin.Gt, token_with_value(">")),
    map_to(Builtin.Notin, sequence(token_with_value("not"), token_with_value("in"))),
    map_to(Builtin.In, token_with_value("in")),
);

const relational_expression = map_recursive_binary_builtin(
    separate1(
        additive_expression,
        relational_operator,
    ),
);

const and_expression = map_recursive_binary_builtin(
    separate1(
        relational_expression,
        map_to(Builtin.And, token_with_value("and")),
    ),
);

const or_expression = map_recursive_binary_builtin(
    separate1(
        and_expression,
        map_to(Builtin.Or, token_with_value("or")),
    ),
);

const primary_expression = map_ctx_reset(or_expression);

const block = lazy(function() {
    return within_brackets(statements);
});

const case_block = lazy(function() {
    return sequence(map_into({ type: NodeType.Case }, 
        choice(
            within_brackets(
                named_sequence(
                    "patterns", patterns,
                    "condition", maybe(map_to_nth(1,
                        sequence(
                            token_with_value("if"),
                            must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
                        ),
                    )),
                    token_with_value("->"),
                    "block", must(statements, { type: ErrorType.ExpectedProduction, production: "statement" }),
                ),
            ),
            named_sequence(
                "patterns", map_to([], pass),
                "block", block
            ),
        ),
    ));
});

const try_else = lazy(function() {
    return map_to_nth(1,
        sequence(
            token_with_value("else"),
            must(block, { type: ErrorType.ExpectedProduction, production: "block" }),
        )  
    );
});

const finally_ = lazy(function() {
    return map_to_nth(1,
        sequence(
            token_with_value("finally"),
            must(block, { type: ErrorType.ExpectedProduction, production: "block" }),
        ),
    );
});

const catch_ = lazy(function() {
    return map_to_nth(1, 
        sequence(
            token_with_value("catch"),
            must(choice(
                cases,
                case_block,
            ), { type: ErrorType.ExpectedProduction, production: "pattern match case" })
        ),
    );
});

const try_expression = map_into({ type: NodeType.TryExpression },
    named_sequence(
        token_with_value("try"),
        "block", block,
        "else_block", maybe(try_else),
        "catch_cases", maybe(catch_),
        "finally_block", maybe(finally_),
    ),
);

const for_expression = lazy(function() {
    return map_into({ type: NodeType.ForExpression }, 
        named_sequence(
            token_with_value("for"),
            "pattern", maybe(map_to_nth(0, sequence(
                pattern,
                token_with_value("in"),
            ))),
            "expression", must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
            "if_condition", maybe(map_to_nth(1,
                sequence(
                    token_with_value("if"),
                    must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
                ),
            )),
            "while_condition", maybe(map_to_nth(1,
                sequence(
                    token_with_value("while"),
                    must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
                ),
            )),
            must_token_with_value("do"),
            "block", must(block, { type: ErrorType.ExpectedProduction, production: "block" }),
        ),
    );
});

const else_case = lazy(function() {
    return map_into({ type: NodeType.ElseCase },
        named_sequence(
            token_with_value("else"),
            must_token_with_value("=>"),
            "block", sequence(must(statement, { type: ErrorType.ExpectedProduction, production: "statement" })),
        ),
    );
});

const case_ = lazy(function() {
    return map_into({ type: NodeType.Case },
        named_sequence(
            "patterns", patterns,
            "condition", maybe(map_to_nth(1,
                sequence(
                    token_with_value("if"),
                    must(expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
            ))),
            token_with_value("=>"),
            "block", must(sequence(statement), { type: ErrorType.ExpectedProduction, production: "statement" }),
        ),
    );
});

const cases = within_brackets(
    map(function(result) {
        const [ cases, else_case ] = result;
        if (else_case) {
            cases.push(else_case);
        }
        return cases;
    }, sequence(
        map_to_nth(0, separate(
            case_,
            token_with_value(","),
        )),
        maybe(map_to_nth(1, sequence(
            token_with_value(","),
            else_case,
        ))),
        maybe(token_with_value(",")),
    )),
);

const match_expression = map_into({ type: NodeType.MatchExpression }, 
    choice(
        named_sequence(
            token_with_value("match"),
            "cases", cases,
        ),
        named_sequence(
            token_with_value("match"),
            "expression", must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
            must_token_with_value("with"),
            "cases", must(cases, { type: ErrorType.ExpectedProduction, production: "pattern match case" }),
        )
    ),
);

const while_expression = map_into({ type: NodeType.WhileExpression },
    named_sequence(
        token_with_value("while"),
        "condition", must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }), 
        must(token_with_value("do")),
        "block", must(block, { type: ErrorType.ExpectedProduction, production: "block" }),
    ),
);

const do_expression = map_into({ type: NodeType.DoExpression }, 
    named_sequence(
        token_with_value("do"),
        "block", must(block, { type: ErrorType.ExpectedProduction, production: "block" }),
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
        "condition", must(primary_expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
        must_token_with_value("then"),
        "then_block", must(block, { type: ErrorType.ExpectedProduction, production: "block" }),
        "else_block", maybe(map_to_nth(1,
            sequence(
                token_with_value("else"),
                must(if_continuation, { type: ErrorType.ExpectedProduction, production: "block or if expression" }),
            ),
        )),
    ),
);

const control_expression = map_ctx_skip_implicit_terminators(
    choice(
        if_expression,
        do_expression,
        while_expression,
        match_expression,
        for_expression,
        try_expression,
    )
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
        "expression", must(expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
    ),
);

const throw_statement = map_into({ type: NodeType.Throw },
    named_sequence(
        token_with_value("throw"),
        "expression", must(expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
    ),
);

const return_statement = map_into({ type: NodeType.Return }, 
    named_sequence(
        token_with_value("return"),
        "expression", must(expression, { type: ErrorType.ExpectedProduction, production: "expression" }),
    ),
);

const pattern_pair = lazy(function() {
    return map_into({ type: NodeType.Pair }, 
        choice(
            named_sequence(
                "key", pattern,
                token_with_value("="),
                "value", must(pattern, { type: ErrorType.ExpectedProduction, production: "pattern" }),
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
        must_token_with_value("["),
        "pairs", must(pattern_pairs, { type: ErrorType.ExpectedProduction, production: "pattern" }),
        must_token_with_value("]"),
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

const box_binding = lazy(function() {
    return map_into({ type: NodeType.BoxExpression },
        named_sequence(
            token_with_value("Box"),
            must_token_with_value("["),
            "value", must(pattern, { type: ErrorType.ExpectedProduction, production: "pattern" }),
            must_token_with_value("]"),
        )
    );
});

const list_binding = map_into({ type: NodeType.ListExpression },
    named_sequence(
        token_with_value("List"),
        must_token_with_value("["),
        "items", must(patterns, { type: ErrorType.ExpectedProduction, production: "items" }),
        must_token_with_value("]"),
    ),
);

const spread_binding = map_into({ type: NodeType.Spread },
    named_sequence(
        token_with_value("..."),
        "value", maybe(token_of_type(NodeType.Identifier), 
    )),
);

const range_binding = map_binary_builtin(sequence(
    token_of_type(NodeType.Number),
    map_to(Builtin.Range, token_with_value("..")),
    must_token_of_type(NodeType.Number),
));

const binding = choice(
    range_binding,
    spread_binding,
    list_binding,
    map_binding,
    box_binding,
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
    map_ctx_skip_implicit_terminators(
        named_sequence(
            "doc", maybe(token_of_type(NodeType.Doc)),
            token_with_value("let"),
            "pattern", must(pattern, { type: ErrorType.ExpectedProduction, production: "pattern" }),
            must_token_with_value("="),
            "expression", must(expression),
        ),
    ),
);

const statement = choice(
    declaration,
    return_statement,
    throw_statement,
    assignment,
    expression,
);

const statements = map_ctx_reset(map_to_nth(1, sequence(
    many(terminator),
    map_to_nth(0, alternate(statement, many1(terminator))),
)));

const module_ = must(all(map_into({ type: NodeType.Module }, 
    named_sequence(
        many(terminator),
        "block", statements,
        many(terminator),
    ),
)), { type: ErrorType.UnexpectedToken });

function filter_tokens(tokens) {
    const filtered_tokens = [];
    const skip_token_types = [ NodeType.Whitespace, NodeType.Comment ];

    for (const token of tokens) {
        if (!skip_token_types.includes(token.type)) {
            filtered_tokens.push(token);
        }
    }
    return filtered_tokens;
}

function check_seperators(tokens) {
    const seperators = {
        openers: [ "(", "[", "{" ],
        closers: [ ")", "]", "}" ],
    };
    const matching_pair = {
        "(": ")",
        ")": "(",
        "[": "]",
        "]": "[",
        "{": "}",
        "}": "{",
    };
    const filtered_tokens = [];
    const seperator_stack = [];

    for (const token of tokens) {
        if (seperators.openers.includes(token.value)) {
            seperator_stack.push(token);
            filtered_tokens.push(token);
            continue;
        }
        if (seperators.closers.includes(token.value)) {
            if (seperator_stack.length === 0) {
                const error = new Error();
                Object.assign(error, {
                    type: ErrorType.UnmatchedSeperators,
                    closing: token,
                })
                throw error;
            }
            const opening = seperator_stack.pop();
            if (matching_pair[opening.value] !== token.value) {
                const error = new Error();
                Object.assign(error, {
                    type: ErrorType.UnmatchedSeperators,
                    opening,
                    closing: token,
                })
                throw error;
            }
            filtered_tokens.push(token);
            continue;
        }
        if (token.type === TokenType.ImplicitTerminator) {
            // Only keep implicit terminators whose immediate context is a block
            // this lets us forget about implicit termiantors in a lot of different situations
            if (seperator_stack.length === 0 || seperator_stack[seperator_stack.length - 1].value === "{") {
                filtered_tokens.push(token);
            }
            continue;
        }
        filtered_tokens.push(token);
    }
    return filtered_tokens;
}

function parse(tokens) {
    // Cleanup tokens
    tokens = filter_tokens(tokens);
    tokens = check_seperators(tokens);
    return module_(Stream(tokens), {});
}

module.exports = { 
    parse,
};