from .parsing import (
    Stream,
    ParsingContext,
    Parser,
    must,
    peek_value,
    parse_value,
    parse_node_type,
    parse_many,
    parse_many_seperated_by,
    parse_choice,
    parse_choice_of_values,
    parse_choice_of_node_types,
    parse_binary_operator,
)
from .node import Node, NodeType, unary_operators

def parse(tokens):
    stream = Stream(tokens)
    ctx = ParsingContext(stream)
    ast = parse_module(ctx)
    assert stream.done()
    return ast

@Parser
def parse_module(ctx):
    """
    module
        = statments
    """
    return Node(NodeType.module, *parse_statements(ctx))

@Parser
def parse_statements(ctx):
    """
    statements
        = { statement ( <terminator> | <eof> ) }
    """
    statements = []
    statement = parse_statement(ctx)
    while statement:
        # print("statements: ", statements)
        # print("statement: ", statement)
        # print("stream: ", ctx.stream)
        must(parse_choice(
            parse_node_type(NodeType.terminator, skip_newlines=False),
            parse_node_type(NodeType.eof),
            peek_value("}"),
        ))(ctx)
        statements.append(statement)
        statement = parse_statement(ctx)
    return statements

@Parser
def parse_statement(ctx):
    """
    statement
        = declaration
        | return_statement
        | yield_statement
        | extend_statement
        | throw_statement
        | assignment
        | expression
    """
    return parse_choice(
        parse_declaraction,
        parse_return_statement,
        parse_yield_statement,
        parse_extend_statement,
        parse_throw_statement,
        parse_assignment,
        parse_expression,
    )(ctx)

@Parser
def parse_declaraction(ctx):
    """
    declaration
        = [ <doc> ] "var" pattern "=" expression
    """
    doc = parse_node_type(NodeType.doc)(ctx)
    if parse_value("var")(ctx):
        pattern = must(parse_pattern)(ctx)
        must(parse_value("="))(ctx)
        expression = must(parse_expression)(ctx)
        return Node(NodeType.declare, pattern, expression, doc)

@Parser
def parse_pattern(ctx):
    """
    pattern
        | range_pattern
        | spread_pattern
        | else_pattern
        | list_literal
        | map_literal
        | literal
        | <identifier>
    """
    return parse_choice(
        parse_range_pattern,
        parse_spread_pattern,
        parse_else_pattern,
        parse_list_literal,
        parse_map_literal,
        parse_literal,
        parse_node_type(NodeType.identifier),
    )(ctx)

@Parser
def parse_range_pattern(ctx):
    """
    range_pattern
        = [ <number> ] ".." <number>
        | <number> ".."
    """
    start = parse_node_type(NodeType.number)(ctx)
    if parse_value("..")(ctx):
        end = parse_node_type(NodeType.number)(ctx)
        assert start or end
        return Node(NodeType.rangeexp, start, end)

@Parser
def parse_spread_pattern(ctx):
    """
    spread_pattern
        = "..." <identifier>
    """
    if parse_value("...")(ctx):
        identifier = parse_node_type(NodeType.identifier)(ctx)
        if identifier:
            return Node(NodeType.spreadexp, identifier)

@Parser
def parse_else_pattern(ctx):
    """
    else_pattern
        = "else"
    """
    if parse_value("else")(ctx):
        return Node(NodeType.elsepat)

@Parser
def parse_list_literal(ctx):
    """
    list_literal
        = "List" "[" expressions "]"
    """
    if parse_value("List")(ctx) and parse_value("[")(ctx):
        expressions = parse_expressions(ctx)
        must(parse_value("]"))(ctx)
        return Node(NodeType.listexp, *expressions)

@Parser
def parse_map_literal(ctx):
    """
    map_literal
        = ""Map "[" pairs "]"
    """
    if parse_value("Map")(ctx) and parse_value("[")(ctx):
        pairs = parse_pairs(ctx)
        must(parse_value("]"))(ctx)
        return Node(NodeType.mapexp, *pairs)

@Parser
def parse_pair(ctx):
    """
    pair
        = "..." simple_expression
        | <identifier> [ ":" expression ]
        | "[" expression "]" ":" expression
    """
    if parse_value("...")(ctx):
        expression = must(parse_simple_expression)(ctx)
        return Node(NodeType.spreadexp, expression)
    identifier = parse_node_type(NodeType.identifier)(ctx)
    if identifier:
        expression = parse_value(":")(ctx) and must(parse_expression)(ctx)
        return Node(NodeType.pair, identifier, expression or None)
    if parse_value("[")(ctx):
        expression = must(parse_expression)(ctx)
        must(parse_value("]"))(ctx)
        return expression

@Parser
def parse_literal(ctx):
    """
    literal
        = <string>
        | <number>
        | <boolean>
        | <nothing>
    """
    return parse_choice_of_node_types(
        NodeType.string,
        NodeType.number,
        NodeType.boolean,
        NodeType.nothing,
    )(ctx)

@Parser
def parse_return_statement(ctx):
    """
    return_statement
        = "return" expression
    """
    if parse_value("return")(ctx):
        expression = must(parse_expression)(ctx)
        return Node(NodeType.returns, expression)

@Parser
def parse_yield_statement(ctx):
    """
    yield_statement
        = "yield" expression
    """
    if parse_value("yield")(ctx):
        expression = must(parse_expression)(ctx)
        return Node(NodeType.yields, expression)

@Parser
def parse_extend_statement(ctx):
    """
    extend_statement
        = "extend" expression
    """
    if parse_value("extend")(ctx):
        expression = must(parse_expression)(ctx)
        return Node(NodeType.extends, expression)

@Parser
def parse_throw_statement(ctx):
    """
    throw_statement
        = "throw" expression
    """
    if parse_value("throw")(ctx):
        expression = must(parse_expression)(ctx)
        return Node(NodeType.throws, expression)

@Parser
def parse_assignment(ctx):
    """
    assignment
        = <identifier> "=" expression
    """
    identifier = parse_node_type(NodeType.identifier)(ctx)
    if identifier and parse_value("=")(ctx):
        expression = must(parse_expression)(ctx)
        return Node(NodeType.assign, identifier, expression)

@Parser
def parse_expression(ctx):
    """
    expression
        = control_expression
        | primary_expression
    """
    return parse_choice(
        parse_control_expression,
        parse_primary_expression,
    )(ctx)

@Parser
def parse_control_expression(ctx):
    """
    constrol_expression
        = if_expression
        | do_expression
        | while_expression
        | match_expression
        | for_expression
        | class_expression
        | try_expression
    """
    return parse_choice(
        parse_if_expression,
        parse_do_expression,
        parse_while_expression,
        parse_match_expression,
        parse_for_expression,
        parse_class_expression,
        parse_try_expression,
    )(ctx)

@Parser
def parse_if_expression(ctx):
    """
    if_expression
        = guard "then" block [ "else" ( block | if_expression ) ]
    """
    guard = parse_guard(ctx)
    if guard:
        must(parse_value("then"))(ctx)
        then_block = must(parse_block)(ctx)
        else_block = parse_value("else")(ctx) and must(parse_choice(
            parse_block,
            parse_if_expression
        ))(ctx)
        return Node(NodeType.ifexp, guard, then_block, else_block or None)

@Parser
def parse_guard(ctx):
    """
    guard
        = "if" primary_expression
    """
    if parse_value("if")(ctx):
        return must(parse_primary_expression)(ctx)

@Parser
def parse_do_expression(ctx):
    """
    do_expression
        = "do" block
    """
    if parse_value("do")(ctx):
        return must(parse_block)(ctx)

@Parser
def parse_while_expression(ctx):
    """
    while_expression
        = while_guard "do" block
    """
    while_guard = parse_while_guard(ctx)
    if while_guard:
        must(parse_value("do"))(ctx)
        block = must(parse_block)(ctx)
        return Node(NodeType.whileexp, while_guard, block)

@Parser
def parse_while_guard(ctx):
    """
    while_guard
        = "while" primary_expression
    """
    if parse_value("while")(ctx):
        return must(parse_primary_expression)(ctx)

@Parser
def parse_match_expression(ctx):
    """
    match_expression
        = "match" primary_expression "with" cases_block
    """
    if parse_value("match")(ctx):
        expression = must(parse_primary_expression)(ctx)
        must(parse_value("with"))(ctx)
        cases = parse_cases_block(ctx)
        return Node(NodeType.matchexp, expression, *cases)

@Parser
def parse_for_expression(ctx):
    """
    for_expression
        = "for" pattern "in" primary_expression [ guard ] [ while_guard ] "do" block
    """
    if parse_value("for")(ctx):
        pattern = must(parse_pattern)(ctx)
        must(parse_value("in"))(ctx)
        expression = must(parse_primary_expression)(ctx)
        guard = parse_guard(ctx)
        while_guard = parse_while_guard(ctx)
        must(parse_value("do"))(ctx)
        block = parse_block(ctx)
        return Node(NodeType.forexp, pattern, expression, guard, while_guard, block)

@Parser
def parse_class_expression(ctx):
    """
    class_expression
        = "Class" ( case_block )
    """
    if parse_value("Class")(ctx):
        case = must(parse_case_block)(ctx)
        return Node(NodeType.classexp, case)

@Parser
def parse_try_expression(ctx):
    """
    try_expression
        = "try" block "catch" ( case_block | block ) [ "finally" block ]
    """
    if parse_value("try")(ctx):
        try_block = parse_block(ctx)
        must(parse_value("catch"))(ctx)
        catch_block = must(parse_case_block)(ctx)
        finally_block = parse_value("finally")(ctx) and must(parse_block)(ctx)
        return Node(NodeType.tryexp, try_block, catch_block, finally_block or None)

@Parser
def parse_primary_expression(ctx):
    """
    primary_expression
        = function
        | generator 
        | list_literal
        | map_literal
        | or_expression
    """
    return parse_choice(
        parse_function,
        parse_generator,
        parse_list_literal,
        parse_map_literal,
        parse_or_expression,
    )(ctx)

@Parser
def parse_function(ctx):
    """
    function
        = "Function" cases_block
        | "Function" case_block
    """
    if parse_value("Function")(ctx):
        cases = parse_cases_block(ctx)
        if cases:
            return Node(NodeType.function, *cases)
    ctx.rollback()
    if parse_value("Function")(ctx):
        case = must(parse_case_block)(ctx)
        return Node(NodeType.function, case)

@Parser
def parse_case_block(ctx):
    """
    case_block
        = "{" patterns "->" statements "}"
        | block
    """
    if parse_value("{")(ctx):
        patterns = parse_patterns(ctx)
        if patterns and parse_value("->")(ctx):
            statements = must(parse_statements)(ctx)
            must(parse_value("}"))(ctx)
            return Node(NodeType.case, patterns, None, Node(NodeType.block, *statements))
    print(ctx.stream)
    ctx.rollback()
    block = parse_block(ctx)
    if block:
        return Node(NodeType.case, None, None, block)

@Parser
def parse_block(ctx):
    """
    block
        = "{" statements "}"
    """
    if parse_value("{")(ctx):
        statements = parse_statements(ctx)
        if parse_value("}")(ctx):
            return Node(NodeType.block, *statements)

@Parser
def parse_cases_block(ctx):
    """
    cases_block
        = "{" cases "}"
    """
    if parse_value("{")(ctx):
        cases = parse_cases(ctx)
        if parse_value("}")(ctx):
            return cases

@Parser
def parse_case(ctx):
    """
    case
        = patterns [ guard ] "=>" statement
    """
    patterns = parse_patterns(ctx)
    if patterns:
        guard = parse_guard(ctx)
        if parse_value("=>")(ctx):
            statement = must(parse_statement)(ctx)
            return Node(NodeType.case, patterns, guard, Node(NodeType.block, statement))

@Parser
def parse_generator(ctx):
    """
    generator
        = "Generator" case_block
    """
    if parse_value("Generator")(ctx):
        case = must(parse_case_block)(ctx)
        return Node(NodeType.generator, case)

@Parser
def parse_or_expression(ctx):
    """
    or_expression
        = and_expression { "or" and_expression }
    """
    return parse_binary_operator(
        parse_and_expression,
        parse_value("or"),
        parse_and_expression,
    )(ctx)

@Parser
def parse_and_expression(ctx):
    """
    and_expression
        = relational_expression { "and" relational_expression }
    """
    return parse_binary_operator(
        parse_relational_expression,
        parse_value("and"),
        parse_relational_expression,
    )(ctx)

@Parser
def parse_relational_expression(ctx):
    """
    relational_expression
        = additive_expression { relational_operator additive_expression }
    """
    return parse_binary_operator(
        parse_additive_expression,
        parse_relational_operator,
        parse_additive_expression
    )(ctx)

@Parser
def parse_relational_operator(ctx):
    return parse_choice_of_values(
        "/=",
        "==",
        "is not",
        "is",
        "<",
        "<=",
        ">",
        ">=",
        "not in",
        "in"
    )(ctx)

@Parser
def parse_additive_expression(ctx):
    """
    additive_expression
        = multiplicative_expression { additive_operator multiplicative_expression }
    """
    return parse_binary_operator(
        parse_multiplicative_expression,
        parse_additive_operator,
        parse_multiplicative_expression,
    )(ctx)

@Parser
def parse_additive_operator(ctx):
    """
    additive_operator
        = "+"
        | "-"
    """
    return parse_choice_of_values("+", "-")(ctx)

@Parser
def parse_multiplicative_expression(ctx):
    """
    multiplicative_expression
        = exponential_expression { multiplicative_operator exponential_expression }
    """
    return parse_binary_operator(
        parse_exponential_expression,
        parse_multiplicative_operator,
        parse_exponential_expression,
    )(ctx)

@Parser
def parse_multiplicative_operator(ctx):
    """
    multiplicative_operator
        = "*"
        | "/"
    """
    return parse_choice_of_values("*", "/")(ctx)

@Parser
def parse_exponential_expression(ctx):
    """
    exponential_expression
        = unary_expression [ exponential_operator exponential_expression ]
    """
    return parse_binary_operator(
        parse_unary_expression,
        parse_exponential_operator,
        parse_exponential_expression,
    )(ctx)

@Parser
def parse_exponential_operator(ctx):
    """
    exponential_operator
        = "^"
        | ".."
    """
    return parse_choice_of_values("^", "..")(ctx)

@Parser
def parse_unary_expression(ctx):
    """
    unary_expression
        = [ unary_operator ] simple_expression { calls_and_accesses }
    """
    unary_operator = parse_unary_operator(ctx)
    expression = parse_simple_expression(ctx)
    if expression:
        expression = parse_calls_and_accesses_of(expression)(ctx)
        if unary_operator:
            expression = Node(unary_operators[unary_operator.value], expression)
        return expression

@Parser
def parse_unary_operator(ctx):
    """
    unary_operator
        = "not"
        | "+"
        | "-"
        | "..."
    """
    return parse_choice_of_values("not", "+", "-", "...")(ctx)

@Parser
def parse_simple_expression(ctx):
    """
    simple_expression
        = "(" expression ")"
        | literal
        | <identifier>
    """
    if parse_value("(")(ctx):
        expression = must(parse_expression)(ctx)
        must(parse_value(")"))(ctx)
        return expression
    return parse_choice(
        parse_literal,
        parse_node_type(NodeType.identifier),
    )(ctx)

def parse_calls_and_accesses_of(expression):
    """
    calls_and_accesses
        = { [ call ] [ access ] }
    """
    @Parser
    def inner_parser(ctx):
        inner_expression = expression
        parsed_call_or_access = True
        while parsed_call_or_access:
            parsed_call_or_access = False
            call = parse_call(ctx)
            if call:
                parsed_call_or_access = True
                inner_expression = Node(NodeType.call, inner_expression, *call)
            access = parse_access(ctx)
            if access:
                parsed_call_or_access = True
                inner_expression = Node(NodeType.access, inner_expression, access)
        return inner_expression
    return inner_parser

@Parser
def parse_call(ctx):
    """
    call
        = "(" expressions ")"
    """
    if parse_value("(")(ctx):
        expressions = parse_expressions(ctx)
        must(parse_value(")"))(ctx)
        return expressions

@Parser
def parse_access(ctx):
    """
    access
        = identifier_access
        | expression_access
        | pattern_access
    """
    return parse_choice(
        parse_identifier_access,
        parse_expression_access,
        parse_pattern_access,
    )(ctx)

@Parser
def parse_identifier_access(ctx):
    """
    identifier_access
        = "." <identifier>
    """
    if parse_value(".")(ctx):
        return must(parse_node_type(NodeType.identifier))

@Parser
def parse_expression_access(ctx):
    """
    expression_access
        = "[" expression "]"
    """
    if parse_value("[")(ctx):
        expression = parse_expression(ctx)
        if parse_value("]")(ctx):
            return expression

@Parser
def parse_pattern_access(ctx):
    """
    pattern_access
        = "[" pattern "]"
    """
    if parse_value("[")(ctx):
        pattern = parse_pattern(ctx)
        if parse_value("]")(ctx):
            return pattern

@Parser
def parse_patterns(ctx):
    """
    patterns
        = [ pattern ] { "," pattern } [ "," ]
    """
    patterns = parse_many_seperated_by(parse_pattern, parse_value(","))(ctx)
    if patterns:
        return Node(NodeType.patterns, *patterns)

@Parser
def parse_expressions(ctx):
    """
    expressions
        = [ expression ] { "," expression } [ "," ]
    """
    return parse_many_seperated_by(parse_expression, parse_value(","))(ctx)

@Parser
def parse_pairs(ctx):
    """
    pairs
        = [ pair ] { "," pair } [ "," ]
    """
    return parse_many_seperated_by(parse_pair, parse_value(","))(ctx)

@Parser
def parse_cases(ctx):
    """
    cases
        = [ case ] { "," case } [ "," ]
    """
    return parse_many_seperated_by(parse_case, parse_value(","))(ctx)