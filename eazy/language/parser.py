from . import node

def parse(tokens):
    return parse_module(stream_of(tokens))

def must(node):
    assert node is not None
    return node

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
        def rollback():
            stream["position"] = checkpoint
        value = function(stream, rollback)
        if not value:
            rollback()
        return value
    return wrapper

@parser
def parse_module(stream, rollback):
    """
    module 
        = statements
    """
    statements = must(parse_statements(stream))
    # print(stream_top(stream))
    assert stream_done(stream)
    return [ None, node.ntype_module, *statements ]

@parser
def parse_statements(stream, rollback):
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
def parse_statement(stream, rollback):
    """
    statement
        = [ <doc>]  "var" ^ pattern "=" expression
        | <ident> "=" ^ expression
        | "return" ^ expression [ "if" ^ expression ]
        | expression
    """
    doc = parse_token(stream, ntype=node.ntype_doc)
    if parse_token(stream, value="var"):
        pattern = must(parse_pattern(stream))
        must(parse_token(stream, value="="))
        expression = must(parse_expression(stream))
        return [ None, node.ntype_var, pattern, expression, doc ]
    rollback()
    ident = parse_token(stream, ntype=node.ntype_ident)
    if ident:
        if parse_token(stream, value="="):
            expression = must(parse_expression(stream))
            return [ None, node.ntype_assign, ident, expression ]
    rollback()
    if parse_token(stream, value="return"):
        expression = must(parse_expression(stream))
        condition = None
        if parse_token(stream, value="if"):
            condition = must(parse_expression(stream))
        return [ None, node.ntype_return, expression, condition ]
    rollback()
    return parse_expression(stream)
 
@parser
def parse_patterns(stream, rollback):
    """
    patterns
        = [ pattern ] { "," pattern } [ "," ]
    """
    patterns = []
    pattern = parse_pattern(stream)
    while pattern:
        patterns.append(pattern)
        pattern = parse_token(stream, value=",") and parse_pattern(stream)
    return [ None, node.ntype_patterns, *patterns ]

@parser
def parse_pattern(stream, rollback):
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
def parse_atom(stream, rollback):
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
def parse_list(stream, rollback):
    if parse_token(stream, value="List"):
        if parse_token(stream, value="["):
            expressions = must(parse_expressions(stream))
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_list, *expressions ]

@parser
def parse_map(stream, rollback):
    if parse_token(stream, value="Map"):
        if parse_token(stream, value="["):
            pairs = must(parse_pairs(stream))
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_map, *pairs ]

@parser
def parse_expressions(stream, rollback):
    """
    expressions 
        = expression { "," expression } [ "," ]
    """
    expressions = []
    expression = parse_expression(stream)
    while expression:
        expressions.append(expression)
        expression = parse_token(stream, value=",") and parse_expression(stream)
    return expressions

@parser
def parse_pairs(stream, rollback):
    """
    pairs 
        = [ pair ] { "," pair } [ "," ]
    """
    pairs = []
    pair = parse_pair(stream)
    while pair:
        pairs.append(pair)
        pair = parse_token(stream, value=",") and parse_pair(stream)
    return pairs

@parser
def parse_pair(stream, rollback):
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
def parse_block(stream, rollback):
    """
    block
        = "{" statements "}"
    """
    if parse_token(stream, value="{"):
        statements = parse_statements(stream)
        if parse_token(stream, value="}"):
            return [ None, node.ntype_block, *statements ]

@parser
def parse_function(stream, rollback):
    """
    function 
        | "Function" "{" patterns "->" statements "}"
        | "Function" "{" cases "}"
        | "Function" block
    """
    if parse_token(stream, value="Function"):
        if parse_token(stream, value="{"):
            patterns = parse_patterns(stream)
            if patterns:
                if parse_token(stream, value="->"):
                    statements = must(parse_statements(stream))
                    must(parse_token(stream, value="}"))
                    return [ None, node.ntype_function, 
                        [ None, node.ntype_case, patterns, None, 
                            [ None, node.ntype_block, *statements ]
                        ]
                    ]
    rollback()
    if parse_token(stream, value="Function"):
        if parse_token(stream, value="{"):
            cases = parse_cases(stream)
            # print('cases:\n', '\n'.join(node.print_node(n) for n in cases))
            if parse_token(stream, value="}"):
                return [ None, node.ntype_function, *cases ]
    rollback()
    if parse_token(stream, value="Function"):
        block = must(parse_block(stream))
        return [ None, node.ntype_function, 
            [ None, node.ntype_case, None, None, block ]
        ]

@parser
def parse_generator(stream, rollback):
    """
    generator
        = "Generator" ^ "{" patterns "->" statements "}"
    """
    if parse_token(stream, value="Generator"):
        must(parse_token(stream, value="{"))
        patterns = must(parse_patterns(stream))
        must(parse_token(stream, value="->"))
        statements = must(parse_statements(stream))
        must(parse_token(stream, value="}"))
        return [ None, node.ntype_generator, 
            [ None, node.ntype_case, patterns, None, 
                [ None, node.ntype_block, *statements ]
            ]
        ]
    
@parser
def parse_cases(stream, rollback):
    """
    cases 
        = case { "," case } [ "," ]
    """
    cases = []
    case = parse_case(stream)
    while case:
        cases.append(case)
        case = parse_token(stream, value=",") and parse_case(stream)
    return cases

@parser
def parse_case(stream, rollback):
    """
    case
        = patterns [ "if" ^ expression ] "=>" ^ expression
    """
    patterns = parse_patterns(stream)
    if patterns:
        condition = None
        if parse_token(stream, value="if"):
            condition = must(parse_expression(stream))
        if parse_token(stream, value="=>"):
            body = must(parse_expression(stream))
            return [ None, node.ntype_case, patterns, condition, body ]

@parser
def parse_expression(stream, rollback):
    """
    expression 
        = expression1 { "or" ^ expression1 }
    """

    @parser
    def parse_operation(stream, rollback):
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
def parse_expression1(stream, rollback):
    """
    expression1
        = expression2 { "and" ^ expression2 }
    """

    @parser
    def parse_operation(stream, rollback):
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
def parse_expression2(stream, rollback):
    """
    expression2
        = expression3  { ( "/=" | "==" | "is" | "<" | "<=" | ">" | ">=" | "in" ) ^ expression3 }
    """
    
    @parser
    def parse_operation(stream, rollback):
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
        notop = parse_token(stream, value="not")
        if notop:
            inop = parse_token(stream, value="in")
            if inop:
                return merge_tokens(notop, inop)
        rollback()
        isop = parse_token(stream, value="is")
        if isop:
            notop = parse_token(stream, value="not")
            if notop:
                return merge_tokens(isop, notop)
            return isop

    expression = parse_expression3(stream)
    if expression:
        operation = parse_operation(stream)
        while operation:
            right = must(parse_expression3(stream))
            expression = [ None, node.binaryop_to_ntype[operation[2]], expression, right ]
            operation = parse_operation(stream)
        return expression
        
@parser
def parse_expression3(stream, rollback):
    """
    expression3
        = expression4 { ( "+" | "-" ) ^ expression4 }
    """

    @parser
    def parse_operation(stream, rollback):
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
def parse_expression4(stream, rollback):
    """
    expression4
        = expression5 { ( "*" | "/" ) ^ expression5 }
    """

    @parser
    def parse_operation(stream, rollback):
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
def parse_expression5(stream, rollback):
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
def parse_expression6(stream, rollback):
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
        | return_expresssion
        | function
        | generator
        | list
        | map
        | [ "..." ]  "(" ^ expression ")" { { path } call }
        | [ "..." ] <ident> { { path } call }
        | atom 
    """
    if_expression = parse_if_expression(stream)
    if if_expression:
        return if_expression
    extend_expression = parse_extend_expression(stream)
    if extend_expression:
        return extend_expression
    do_expression = parse_do_expression(stream)
    if do_expression:
        return do_expression
    while_expression = parse_while_expression(stream)
    if while_expression:
        return while_expression
    match_expression = parse_match_expression(stream)
    if match_expression:
        return match_expression
    for_expression = parse_for_expression(stream)
    if for_expression:
        return for_expression
    class_expression = parse_class_expression(stream)
    if class_expression:
        return class_expression
    try_expression = parse_try_expression(stream)
    if try_expression:
        return try_expression
    throw_expression = parse_throw_expression(stream)
    if throw_expression:
        return throw_expression
    return_expression = parse_return_expression(stream)
    if return_expression:
        return return_expression
    function = parse_function(stream)
    if function:
        return function
    generator = parse_generator(stream)
    if generator:
        return generator
    list_literal = parse_list(stream)
    if list_literal:
        return list_literal
    map_literal = parse_map(stream)
    if map_literal:
        return map_literal
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
    rollback()
    return parse_atom(stream)
    

@parser
def parse_if_expression(stream, rollback):
    """
    if_expression
        = "if" expression "then" block "else" if_expression
        | "if" ^ expression "then" block [ "else" ^ block ]
    """
    if parse_token(stream, value="if"):
        expression = parse_expression(stream)
        if expression and parse_token(stream, value="then"):
            block = parse_block(stream)
            if block and parse_token(stream, value="else"):
                if_expression = parse_if_expression(stream)
                if if_expression:
                    return [ None, node.ntype_if, expression, block, if_expression ]
    rollback()
    if parse_token(stream, value="if"):
        expression = must(parse_expression(stream))
        must(parse_token(stream, value="then"))
        block = must(parse_block(stream))
        else_block = None
        if parse_token(stream, value="else"):
            else_block = must(parse_block(stream))
        return [ None, node.ntype_if, expression, block, else_block ]

@parser
def parse_extend_expression(stream, rollback):
    """
    extend_expression
        = "extend" ^ expression
    """
    if parse_token(stream, value="extend"):
        expression = must(parse_expression(stream))
        return [ None, node.ntype_extend, expression ]

@parser
def parse_do_expression(stream, rollback):
    """
    do_expression
        = "do" ^ block
    """
    if parse_token(stream, value="do"):
        block = must(parse_block(stream))
        return [ None, node.ntype_do, block ]

@parser
def parse_while_expression(stream, rollback):
    """
    while_expression
        = "while" ^ expression "do" block
    """
    if parse_token(stream, value="while"):
        expression = must(parse_expression(stream))
        must(parse_token(stream, value="do"))
        block = must(parse_block(stream))
        return [ None, node.ntype_while, expression, block ]

@parser
def parse_match_expression(stream, rollback):
    """
    match_expression
        = "match" ^ expression "in" "{" cases "}"
    """
    if parse_token(stream, value="match"):
        expression = must(parse_expression(expression))
        must(parse_token(stream, value="in"))
        must(parse_token(stream, value="{"))
        cases = must(parse_cases(stream))
        must(parse_token(stream, value="}"))
        return [ None, node.ntype_match, *cases ]

@parser
def parse_for_expression(stream, rollback):
    """
    for_expression
        = "for" ^ pattern "in" expression [ "if" ^ expression ] [ "while" expression ] "do" block
    """
    if parse_token(stream, value="for"):
        pattern = must(parse_pattern(stream))
        must(parse_token(stream, value="in"))
        expression = must(parse_expression(stream))
        condition = None
        if parse_token(stream, value="if"):
            condition = must(parse_expression(stream))
        while_condition = None
        if parse_token(stream, value="while"):
            while_condition = must(parse_expression(stream))
        must(parse_token(stream, value="do"))
        block = must(parse_block(stream))
        return [ None, node.ntype_for, pattern, expression, condition, while_condition, block ]

@parser
def parse_class_expression(stream, rollback):
    """
    class_expression
        = "Class" ^ "{" patterns [ "if" expression ]  "->" ^ statements "}"
    """
    if parse_token(stream, value="Class"):
        if parse_token(stream, value="{"):
            patterns = parse_patterns(stream)
            if patterns:
                condition = None
                if parse_token(stream, value="if"):
                    condition = must(parse_expression(stream))
                if parse_token(stream, value="->"):
                    statements = must(parse_statements(stream))
                    must(parse_token(stream, value="}"))
                    return [ None, node.ntype_class,
                        [ None, node.ntype_function, 
                            [ None, node.ntype_case, patterns, condition, 
                                [ None, node.ntype_block, *statements ]
                            ]
                        ]
                    ]

@parser
def parse_try_expression(stream, rollback):
    """
    try_expression
        = "try" ^ block "catch" block
    """
    if parse_token(stream, value="try"):
        try_block = must(parse_block(stream))
        must(parse_token(stream, value="catch"))
        catch_block = must(parse_block(stream))
        return [ None, node.ntype_try, try_block, catch_block ]

@parser
def parse_throw_expression(stream, rollback):
    """
    throw_expression
        = "throw" ^ expression [ "if" ^ expression ]
    """
    if parse_token(stream, value="throw"):
        expression = must(parse_expression(stream))
        condition = None
        if parse_token(stream, value="if"):
            condition = must(parse_expression(stream))
        return [ None, node.ntype_throw, expression, condition ]

@parser
def parse_return_expression(stream, rollback):
    """
    return_expresssion
        = "return" ^ expression [ "if" ^ expression ]
    """
    if parse_token(stream, value="return"):
        expression = must(parse_expression(stream))
        condition = None
        if parse_token(stream, value="if"):
            condition = must(parse_expression(stream))
        return [ None, node.ntype_throw, expression, condition ]

@parser
def parse_path(stream, rollback):
    """
    path
        = "." <ident>
        | "[" ".." ^ expression "]"
        | "[" expression [ ".." ] "]"
    """
    if parse_token(stream, value="."):
        ident = parse_token(stream, ntype=node.ntype_ident)
        return ident
    rollback()
    if parse_token(stream, value="["):
        if parse_token(stream, value=".."):
            expression = must(parse_expression(stream))
            must(parse_token(stream, value="]"))
            return [ None, node.ntype_range, None, expression ]
    rollback()
    if parse_token(stream, value="["):
        expression = parse_expression(stream)
        if expression:
            if parse_token(stream, value=".."):
                if parse_token(stream, value="]"):
                    return [ None, node.ntype_range, expression ]
            if parse_token(stream, value="]"):
                return expression

@parser
def parse_call(stream, rollback):
    """
    call
        = "(" expressions ")"
    """
    if parse_token(stream, value="("):
        expressions = parse_expressions(stream)
        if expressions and parse_token(stream, value=")"):
            return expressions