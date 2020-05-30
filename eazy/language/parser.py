from . import node

def parse(tokens):
    return parse_module(stream_of(tokens))

def must(node):
    assert node is not None
    return node

def many(parse, stream):
    parts = []
    part = parse(stream)
    while part:
        parts.append(part)
        part = parse_token(stream, value=",") and parse(stream)
    return parts

def merge_tokens(token1, token2):
    meta1, ntype1, value1 = token1
    meta2, ntype2, value2 = token2
    return [ meta1, ntype1, value1 + value2 ]

def stream_of(tokens):
    return {
        "position": 0,
        "tokens": tokens
    }

def stream_position(stream, skip_newlines=True, skip_docs=True):
    position = stream["position"]
    while position < len(stream["tokens"]) and (
        (skip_newlines and stream["tokens"][position][2] == "\n") or
        (skip_docs and stream["tokens"][position][1] == node.ntype_doc)
    ):
        position += 1
    return position

def stream_top(stream, skip_newlines=True, skip_docs=True):
    position = stream_position(stream, skip_newlines, skip_docs)
    if position < len(stream["tokens"]):
        return stream["tokens"][position]
    return None

def stream_chomp(stream, skip_newlines=True, skip_docs=True):
    token = stream_top(stream, skip_newlines, skip_docs)
    position = stream_position(stream, skip_newlines, skip_docs)
    stream["position"] = position + 1
    return token

def stream_done(stream):
    return stream_top(stream) is None

def peek_token(stream, ntype=None, value=None):
    skip_newlines = ntype != node.ntype_terminator
    skip_docs = ntype != node.ntype_doc
    token = stream_top(stream, skip_newlines, skip_docs)
    if not token:
        return None
    _, token_ntype, token_value = token
    if ntype and token_ntype != ntype:
        return None
    if value and token_value != value:
        return None
    return True

def parse_token(stream, ntype=None, value=None):
    if peek_token(stream, ntype, value):
        skip_newlines = ntype != node.ntype_terminator
        skip_docs = ntype != node.ntype_doc
        return stream_chomp(stream, skip_newlines, skip_docs)

def parser(function):
    def wrapper(stream):
        checkpoint = stream["position"]
        value = function(stream)
        if not value:
            stream["position"] = checkpoint
        return value
    return wrapper

@parser
def parse_module(stream):
    """
    module 
        = statements
    """
    statements = must(parse_statements(stream))
    # print(stream_top(stream))
    assert stream_done(stream)
    return [ None, node.ntype_module, *statements ]

@parser
def parse_statements(stream):
    """
    statements 
        = { statement <terminator> }
    """
    statements = []
    statement = parse_statement(stream)
    while statement:
        # print()
        # print("statements:", node.print_node(statement))
        # print("stream:", stream_top(stream))
        must(parse_token(stream, ntype=node.ntype_terminator) or peek_token(stream, value="}"))
        statements.append(statement)
        statement = parse_statement(stream)
    return statements

@parser
def parse_statement(stream):
    """
    statement
        = declaration
        | return_statement
        | yield_statement
        | extend_statement
        | assignment
        | expression
    """
    return (parse_declaration(stream)
        or parse_assignment(stream)
        or parse_return_statement(stream)
        or parse_yield_statement(stream)
        or parse_extend_statement(stream)
        or parse_expression(stream)
    )

@parser
def parse_declaration(stream):
    """
    declaration
        = [ <doc> ] "var" ^ pattern "=" expression
    """
    doc = parse_token(stream, ntype=node.ntype_doc)
    if parse_token(stream, value="var"):
        pattern = must(parse_pattern(stream))
        must(parse_token(stream, value="="))
        expression = must(parse_expression(stream))
        return [ None, node.ntype_var, pattern, expression, doc ]

@parser
def parse_return_statement(stream):
    """
    return_statement
        = "return" ^ expression
    """
    if parse_token(stream, value="return"):
        expression = must(parse_expression(stream))
        return [ None, node.ntype_return, expression ]

@parser
def parse_yield_statement(stream):
    """
    yield_statement
        = "yield" ^ expression
    """
    if parse_token(stream, value="yield"):
        expression = must(parse_expression(stream))
        return [ None, node.ntype_yield, expression ]

@parser
def parse_extend_statement(stream):
    """
    extend_statement
        = "extend" ^ expression
    """
    if parse_token(stream, value="extend"):
        expression = must(parse_expression(stream))
        return [ None, node.ntype_extend, expression ]

@parser
def parse_assignment(stream):
    """
    assignment
        = <ident> "=" ^ expression
    """
    ident = parse_token(stream, ntype=node.ntype_ident)
    if ident:
        if parse_token(stream, value="="):
            expression = must(parse_expression(stream))
            return [ None, node.ntype_assign, ident, expression ]

@parser
def parse_pattern(stream):
    """
    pattern
        = list
        | map
        | atom
    """
    list_literal = parse_list(stream)
    if list_literal:
        return list_literal
    map_literal = parse_map(stream)
    if map_literal:
        return map_literal
    return parse_atom(stream)

@parser
def parse_atom(stream):
    """
    atom
        | [ "..." ^ ] <ident>
        | <string>
        | <number>
    """
    if parse_token(stream, value="..."):
        ident = must(parse_token(stream, ntype=node.ntype_ident))
        return [ None, node.ntype_spread, ident ]
    return (parse_token(stream, ntype=node.ntype_ident)
        or parse_token(stream, ntype=node.ntype_string)
        or parse_token(stream, ntype=node.ntype_number)
    )

@parser
def parse_list(stream):
    if parse_token(stream, value="List"):
        if parse_token(stream, value="["):
            expressions = must(parse_expressions(stream))
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_list, *expressions ]

@parser
def parse_map(stream):
    if parse_token(stream, value="Map"):
        if parse_token(stream, value="["):
            pairs = must(parse_pairs(stream))
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_map, *pairs ]

@parser
def parse_pair(stream):
    """
    pair
        = <ident> [ ":" ^ expression ]
        | "[" ^ expression "]" ":" expression
    """
    ident = parse_token(stream, ntype=node.ntype_ident)
    if ident:
        expression = None
        if parse_token(stream, value=":"):
            expression = must(parse_expression(stream))
        return [ None, node.ntype_pair, ident, expression ]
    if parse_token(stream, value = "["):
        key = must(parse_expression(stream))
        must(parse_token(stream, value="]"))
        must(parse_token(stream, value=":"))
        value = must(parse_expression(stream))
        return [ None, node.ntype_pair, key, value ]

@parser
def parse_block(stream):
    """
    block
        = "{" statements "}"
    """
    if parse_token(stream, value="{"):
        statements = parse_statements(stream)
        if parse_token(stream, value="}"):
            return [ None, node.ntype_block, *statements ]

@parser
def parse_function(stream):
    """
    function
        = "Function" "{" ^ (cases | single_case | statemtns) "}"
    """
    if parse_token(stream, value='Function') and parse_token(stream, value='{'):
        cases = parse_cases(stream)
        if cases:
            must(parse_token(stream, value="}"))
            return [ None, node.ntype_function, *cases ]
        single = parse_single_case(stream)
        if single:
            must(parse_token(stream, value="}"))
            return [ None, node.ntype_function, single ]
        statements = must(parse_statements(stream))
        must(parse_token(stream, value="}"))
        return [ None, node.ntype_function, 
            [ None, node.ntype_case, 
                None,
                None,
                [ None, node.ntype_block, *statements ],
            ],
        ]

@parser
def parse_single_case(stream):
    """
    single_case
        = patterns "->" ^ statements
    """
    patterns = parse_patterns(stream)
    if patterns and parse_token(stream, value="->"):
        statements = must(parse_statements(stream))
        return [ None, node.ntype_case,
            patterns,
            None,
            [ None, node.ntype_block, *statements ],
        ]

@parser
def parse_generator(stream):
    """
    generator
        = "Generator" ^ "{" [ single_case ] "}"
    """
    if parse_token(stream, value="Generator"):
        must(parse_token(stream, value="{"))
        single_case = parse_single_case(stream)
        must(parse_token(stream, value="}"))
        return [ None, node.ntype_generator, 
            single_case or [ None, node.ntype_case,
                None, 
                None,
                [ None, node.ntype_block ],
            ],
        ]

@parser
def parse_case(stream):
    """
    case
        = patterns [ guard ] "=>" ^ expression
    """
    patterns = parse_patterns(stream)
    if patterns:
        guard = parse_guard(stream)
        if parse_token(stream, value="=>"):
            body = must(parse_expression(stream))
            return [ None, node.ntype_case, patterns, guard, body ]

@parser
def parse_expression(stream):
    """
    expression 
        = expression1 { "or" ^ expression1 }
    """

    @parser
    def parse_operation(stream):
        return parse_token(stream, value="or")

    expression = parse_expression1(stream)
    if expression:
        operation = parse_operation(stream)
        while operation:
            right = must(parse_expression1(stream))
            expression = [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
            operation = parse_operation(stream)
        return expression
    
@parser
def parse_expression1(stream):
    """
    expression1
        = expression2 { "and" ^ expression2 }
    """

    @parser
    def parse_operation(stream):
        return parse_token(stream, value="and")

    expression = parse_expression2(stream)
    if expression:
        operation = parse_operation(stream)
        while operation:
            right = must(parse_expression2(stream))
            expression = [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
            operation = parse_operation(stream)
        return expression

@parser
def parse_expression2(stream):
    """
    expression2
        = expression3  { ( "/=" | "==" | "is" "not" | "is" | "<" | "<=" | ">" | ">=" | "in" | "not" "in") ^ expression3 }
    """
    
    @parser
    def parse_operation(stream):
        operation = (parse_token(stream, value="/=")
            or parse_token(stream, value="==")
            or parse_token(stream, value="<")
            or parse_token(stream, value="<=")
            or parse_token(stream, value=">")
            or parse_token(stream, value=">=")
            or parse_token(stream, value="in")
        )
        if operation:
            return operation
        isop = parse_token(stream, value="is")
        if isop:
            notop = parse_token(stream, value="not")
            if notop:
                return merge_tokens(isop, notop)
            return isop
        notop = parse_token(stream, value="not")
        if notop:
            inop = parse_token(stream, value="in")
            if inop:
                return merge_tokens(notop, inop)

    expression = parse_expression3(stream)
    if expression:
        operation = parse_operation(stream)
        while operation:
            right = must(parse_expression3(stream))
            expression = [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
            operation = parse_operation(stream)
        return expression
        
@parser
def parse_expression3(stream):
    """
    expression3
        = expression4 { ( "+" | "-" ) ^ expression4 }
    """

    @parser
    def parse_operation(stream):
        return parse_token(stream, value="+") or parse_token(stream, value="-")

    expression = parse_expression4(stream)
    if expression:
        operation = parse_operation(stream)
        while operation:
            right = must(parse_expression4(stream))
            expression = [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
            operation = parse_operation(stream)
        return expression

@parser
def parse_expression4(stream):
    """
    expression4
        = expression5 { ( "*" | "/" ) ^ expression5 }
    """

    @parser
    def parse_operation(stream):
        return parse_token(stream, value="*") or parse_token(stream, value="/")

    expression = parse_expression5(stream)
    if expression:
        operation = parse_operation(stream)
        while operation:
            right = must(parse_expression5(stream))
            expression = [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
            operation = parse_operation(stream)
        return expression

@parser
def parse_expression5(stream):
    """
    expression5
        = ( "not" | "+" | "-" ) ^ expression
        | expression6 [ ( ".." | "^" ) expression ]
    """
    operation = (parse_token(stream, value="not") 
        or parse_token(stream, value="+")
        or parse_token(stream, value="-")
    )
    if operation:
        expression = must(parse_expression(stream))
        return [ None, node.binaryop_to_ntype[operation[2]], expression ]
    expression = parse_expression6(stream)
    if expression:
        operation = parse_token(stream, value="..") or parse_token(stream, value="^")
        if operation:
            right = must(parse_expression(stream))
            return [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
        return expression
    
@parser
def parse_expression6(stream):
    """
    expression6 =
        | if_expression
        | extend_expression
        | do_expression
        | while_expression
        | match_expression
        | for_expression
        | class_expression
        | try_expression
        | throw_expression
        | return_expression
        | yield_expression
        | function
        | generator
        | list
        | map
        | expression7
    """
    return (parse_if_expression(stream)
        or parse_do_expression(stream) 
        or parse_while_expression(stream) 
        or parse_match_expression(stream) 
        or parse_for_expression(stream) 
        or parse_class_expression(stream) 
        or parse_try_expression(stream) 
        or parse_throw_expression(stream) 
        or parse_function(stream) 
        or parse_generator(stream) 
        or parse_list(stream) 
        or parse_map(stream) 
        or parse_expression7(stream)
    )

@parser
def parse_expression7(stream):
    """
    expression7
        = [ "..." ] spreadable
        | atom
    """
    spread = parse_token(stream, value="...")
    if parse_token(stream, value="("):
        expression = must(parse_expression(stream))
        must(parse_token(stream, value=")"))
        path = parse_path(stream)
        while path:
            expression = [ None, node.ntype_path, expression, path ]
            path = parse_path(stream)
        call = parse_call(stream)
        while call:
            expression = [ None, node.ntype_call, expression, *call ]
            path = parse_path(stream)
            while path:
                expression = [ None, node.ntype_path, expression, path ]
                path = parse_path(stream)
            call = parse_call(stream)
        if spread:
            return [ None, node.ntype_spread, expression ]
        return expression
    ident = parse_token(stream, ntype=node.ntype_ident)
    if ident:
        expression = ident
        path = parse_path(stream)
        while path:
            expression = [ None, node.ntype_path, expression, path ]
            path = parse_path(stream)
        call = parse_call(stream)
        while call:
            expression = [ None, node.ntype_call, expression, *call ]
            path = parse_path(stream)
            while path:
                expression = [ None, node.ntype_path, expression, path ]
                path = parse_path(stream)
            call = parse_call(stream)
        if spread:
            return [ None, node.ntype_spread, expression ]
        return expression
    return parse_atom(stream)
    
@parser
def parse_if_expression(stream):
    """
    if_expression
        = guard ^ "then" block [ "else" ^ ( block | if_expression ) ]
    """
    expression = parse_guard(stream)
    if expression:
        must(parse_token(stream, value="then"))
        then_block = must(parse_block(stream))
        else_block = None
        if parse_token(stream, value="else"):
            else_block = must(parse_block(stream) or parse_if_expression(stream))
        return [ None, node.ntype_if, expression, then_block, else_block ]

@parser
def parse_guard(stream):
    if parse_token(stream, value="if"):
        return must(parse_expression(stream))

@parser
def parse_do_expression(stream):
    """
    do_expression
        = "do" ^ block
    """
    if parse_token(stream, value="do"):
        return must(parse_block(stream))

@parser
def parse_while_expression(stream):
    """
    while_expression
        = while_guard ^ "do" block
    """
    expression = parse_while_guard(stream)
    if expression:
        must(parse_token(stream, value="do"))
        block = must(parse_block(stream))
        return [ None, node.ntype_while, expression, block ]

@parser
def parse_while_guard(stream):
    if parse_token(stream, value="while"):
        return must(parse_expression(stream))

@parser
def parse_match_expression(stream):
    """
    match_expression
        = "match" ^ expression "with" "{" cases "}"
    """
    if parse_token(stream, value="match"):
        expression = must(parse_expression(stream))
        must(parse_token(stream, value="with"))
        must(parse_token(stream, value="{"))
        cases = must(parse_cases(stream))
        must(parse_token(stream, value="}"))
        return [ None, node.ntype_match, expression, *cases ]

@parser
def parse_for_expression(stream):
    """
    for_expression
        = "for" ^ pattern "in" expression [ guard ] [ while_guard ] "do" block
    """
    if parse_token(stream, value="for"):
        pattern = must(parse_pattern(stream))
        must(parse_token(stream, value="in"))
        expression = must(parse_expression(stream))
        guard = parse_guard(stream)
        while_guard = parse_while_guard(stream)
        must(parse_token(stream, value="do"))
        block = must(parse_block(stream))
        return [ None, node.ntype_for, pattern, expression, guard, while_guard, block ]

@parser
def parse_class_expression(stream):
    """
    class_expression
        = "Class" "{" ^ single "}"
    """
    if parse_token(stream, value="Class") and parse_token(stream, value="{"):
        single = must(parse_single_case(stream))
        must(parse_token(stream, value="}"))
        return [ None, node.ntype_class,
            [ None, node.ntype_function, single ],
        ]

@parser
def parse_try_expression(stream):
    """
    try_expression
        = "try" ^ block "catch" single_case [ "finally" ^ block [] )
    """
    if parse_token(stream, value="try"):
        try_block = must(parse_block(stream))
        must(parse_token(stream, value="catch"))
        must(parse_token(stream, value="{"))
        catch = must(parse_single_case(stream))
        must(parse_token(stream, value="}"))
        finally_block = parse_token(stream, value="finally") and must(parse_block(stream))
        return [ None, node.ntype_try, try_block, 
            [ None, node.ntype_function, catch ],
            finally_block,
        ]

@parser
def parse_throw_expression(stream):
    """
    throw_expression
        = "throw" ^ expression [ guard ]
    """
    if parse_token(stream, value="throw"):
        expression = must(parse_expression(stream))
        return [ None, node.ntype_throw, expression ]

@parser
def parse_path(stream):
    """
    path
        = "." ^ <ident>
        | "[" ".." ^ expression "]"
        | "[" ^ expression [ ".." ] "]"
    """
    if parse_token(stream, value="."):
        return must(parse_token(stream, ntype=node.ntype_ident))
    if parse_token(stream, value="["):
        if parse_token(stream, value=".."):
            expression = must(parse_expression(stream))
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_range, None, expression ]
        expression = must(parse_expression(stream))
        if parse_token(stream, value=".."):
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_range, expression ]
        must(parse_token(stream, value="]"))
        return expression

@parser
def parse_call(stream):
    """
    call
        = "(" ^ expressions ")"
    """
    if parse_token(stream, value="("):
        expressions = must(parse_expressions(stream))
        must(parse_token(stream, value=")"))
        return expressions

@parser
def parse_patterns(stream):
    """
    patterns
        = [ pattern ] { "," pattern } [ "," ]
    """
    return [ None, node.ntype_patterns, *many(parse_pattern, stream) ]

@parser
def parse_expressions(stream):
    """
    expressions 
        = expression { "," expression } [ "," ]
    """
    return many(parse_expression, stream)

@parser
def parse_pairs(stream):
    """
    pairs 
        = [ pair ] { "," pair } [ "," ]
    """
    return many(parse_pair, stream)

@parser
def parse_cases(stream):
    """
    cases
        = [ case ] { "," case } [ "," ]
    """
    return many(parse_case, stream)
