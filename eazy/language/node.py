import types

class Node:

    def __init__(self, node_type, *args, meta=None):
        self.node_type = node_type
        self.value = args[0] if args else None
        self.args = args
        self.meta = meta or {}

    def __eq__(self, other):
        return (isinstance(other, Node) 
            and self.node_type == other.node_type 
            and self.args == other.args
        )

    def __repr__(self):
        return f"({self.node_type} {' '.join(repr(arg) for arg in self.args)})"


class NodeType:
    # AST node types           # Structure
    module = "module"           # (module ...statements)
    declare = "declare"         # (declare pattern expression doc)
    returns = "returns"         # (returns expression)
    yields = "yields"           # (yields expression)
    extends = "extends"         # (extends expression)
    throws = "throws"           # (throws expression)
    assign = "assign"           # (assign ident expression)
    listexp = "listexp"         # (listexp ...expressions)
    mapexp = "mapexp"           # (mapexp ...pairs)
    pair = "pair"               # (pair key value)
    elsepat = "elsepat"         # (elsepat else)
    string = "string"           # (string value)
    number = "number"           # (number value)
    boolean = "boolean"         # (boolean value)
    nothing = "nothing"         # (nothing value)
    identifier = "identifier"   # (identifier value)
    ifexp = "ifexp"             # (ifexp condition then else)
    whileexp = "whilexpr"       # (whilexp condition block)
    matchexp = "matchexp"       # (match expression ...cases)
    forexp = "forexp"           # (forexp pattern expression if while)
    classexp = "classexp"       # (classexp function)
    tryexp = "tryexp"           # (tryexp block catch finally)
    block = "block"             # (block ...statements)
    function = "function"       # (function ...cases)
    generator = "generator"     # (generator case) 
    case = "case"               # (case patterns condition block)
    patterns="patterns"         # (patterns ...patterns)
    orexp = "orexp"             # (orexp left right)
    andexp = "andexp"           # (andexp left right)
    neqexp = "neqexp"           # (neqexp left right)
    eqexp = "eqexp"             # (eqexp left right)
    isnotexp = "isnotexp"       # (isnotexp left right)
    isexp = "isexp"             # (isexp left right)
    ltexp = "ltexp"             # (ltexp left right)
    lteexp = "lteexp"           # (lteexp left right)
    gtexp = "gtexp"             # (gteexp left right)
    gteexp = "gteexp"           # (gteexp left right)
    notinexp = "notinexp"       # (notinexp left right)
    inexp = "inexp"             # (inexp left right)
    addexp = "addexp"           # (addexp left right)
    subexp = "subexp"           # (subexp left right)
    mulexp = "mulexp"           # (mulexp left right)
    divexp = "divexp"           # (divexp left right)
    powexp = "powexp"           # (powexp left right)
    rangeexp = "rangeexp"       # (rangeexp start end)
    notexp = "notexp"           # (notexp expression)
    posexp = "posexp"           # (posexp expression)
    negexp = "negexp"           # (negexp)
    spreadexp = "spreadexp"     # (spreadexp expression)
    call = "call"               # (call function ...arguments)
    access = "access"           # (access data path)
    # Token node types
    doc = "doc"
    terminator = "terminator"
    punctuation = "punctuation"
    keyword = "ketword"
    operator = "operator"
    eof = "eof"

binary_operators = {
    "or" : NodeType.orexp,
    "and": NodeType.andexp,
    "/=": NodeType.neqexp,
    "==": NodeType.eqexp,
    "is": NodeType.isexp,
    "is not": NodeType.isnotexp,
    "<": NodeType.ltexp,
    "<=": NodeType.lteexp,
    ">": NodeType.gtexp,
    ">=": NodeType.gteexp,
    "in": NodeType.inexp,
    "not in": NodeType.notinexp,
    "+": NodeType.addexp,
    "-": NodeType.subexp,
    "*": NodeType.mulexp,
    "/": NodeType.divexp,
    "..": NodeType.rangeexp,
    "^": NodeType.powexp,
}

unary_operators = {
    "not": NodeType.notexp,
    "+": NodeType.posexp,
    "-": NodeType.negexp,
    "...": NodeType.spreadexp,
}

# Nodes are represented as lists of the form
# 
#   List [ meta, ntype, ...args ]
#
# - meta is either a Map cotinaing meta data or Nothing
# - ntype is a string 

# Node Types                    # Structure
ntype_module = "module"         # [module ...statements]
ntype_assign = "assign"         # [assign ident expression]
ntype_var = "var"               # [var pattern expression]
ntype_return = "return"         # [return expression condition]
ntype_yield = "yield"           # [yield expression]
ntype_spread = "spread"         # [spread expression]
ntype_list = "list"             # [list ...expressions]
ntype_map = "map"               # [map ...pairs]
ntype_pair = "pair"             # [pair key value]
ntype_path = "path"             # [path data key]
ntype_block = "block"           # [block ...statements]
ntype_function = "function"     # [function ...cases]
ntype_generator = "generator"   # [generator ...case]
ntype_case = "case"             # [case patterns guard body]
ntype_patterns = "patterns"     # [patterns ...pattern]
ntype_if = "if"                 # [if condition then else]
ntype_extend = "extend"         # [extend expression]
ntype_while = "while"           # [while condition block ]
ntype_match = "match"           # [match expression function]
ntype_for = "for"               # [for pattern expression guard block]
ntype_class = "class"           # [class function]
ntype_try = "try"               # [try block catch]
ntype_throw = "throw"           # [throw expression]
ntype_or = "or"                 # [or left right]
ntype_and = "and"               # [and left right]
ntype_neq = "neq"               # [neq left right]
ntype_eq = "eq"                 # [eq left right]
ntype_is = "is"                 # [is left right]
ntype_isnot = "isnot"           # [isnot left right]
ntype_lt = "lt"                 # [lt left right]
ntype_lte = "lte"               # [lte left right]
ntype_gt = "gt"                 # [gt left right]
ntype_gte = "gte"               # [gte left right]
ntype_in = "in"                 # [in left right]
ntype_notin = "notin"           # [notin left right] 
ntype_add = "add"               # [add left right]
ntype_sub = "sub"               # [sub left right]
ntype_mul = "mul"               # [mul left right]
ntype_div = "div"               # [div left right]
ntype_not = "not"               # [not expression]
ntype_pos = "pos"               # [pos expression]
ntype_neg = "neg"               # [neg expression]
ntype_range = "range"           # [range expression]
ntype_pow = "pow"               # [pow expression]
ntype_call = "call"             # [call function ...arguments]
                                # terminals
ntype_terminator = "terminator" # [terminator token]
ntype_token = "token"           # [token token]
ntype_else = "else"             # [else]
ntype_doc = "doc"               # [doc token]
ntype_ident = "ident"           # [ident token]
ntype_string = "string"         # [string token]
ntype_number = "number"         # [number token]
ntype_boolean = "boolean"       # [boolean token]
ntype_nothing = "nothing"       # [nothing]

ntypes = [
    ntype_module,
    ntype_assign,
    ntype_var,
    ntype_return,
    ntype_yield,
    ntype_spread,
    ntype_list,
    ntype_map,
    ntype_pair,
    ntype_path,
    ntype_block,
    ntype_function,
    ntype_generator,
    ntype_case,
    ntype_patterns,
    ntype_if,
    ntype_extend,
    ntype_while,
    ntype_match,
    ntype_for,
    ntype_class,
    ntype_try,
    ntype_throw,
    ntype_or,
    ntype_and,
    ntype_neq,
    ntype_eq,
    ntype_is,
    ntype_isnot,
    ntype_lt,
    ntype_lte,
    ntype_gt,
    ntype_gte,
    ntype_in,
    ntype_notin,
    ntype_add,
    ntype_sub,
    ntype_mul,
    ntype_div,
    ntype_not,
    ntype_pos,
    ntype_neg,
    ntype_range,
    ntype_pow,
    ntype_call,
    ntype_ident,
    ntype_string,
    ntype_number,
    ntype_boolean,
    ntype_nothing,
]

binaryop_to_ntype = {
    "or" : ntype_or,
    "and": ntype_and,
    "/=": ntype_neq,
    "==": ntype_eq,
    "is": ntype_is,
    "is not": ntype_isnot,
    "<": ntype_lt,
    "<=": ntype_lte,
    ">": ntype_gt,
    ">=": ntype_gte,
    "in": ntype_in,
    "not in": ntype_notin,
    "+": ntype_add,
    "-": ntype_sub,
    "*": ntype_mul,
    "/": ntype_div,
    "..": ntype_range,
    "^": ntype_pow,
}

unaryop_to_ntype = {
    "not": ntype_not,
    "+": ntype_pos,
    "-": ntype_neg,
    "...": ntype_spread,
}

def print_node(node, indent='  ', level=0):
    if node == None:
        return (indent * level) + 'None'
    meta, ntype = node[:2]
    args = node[2:]
    prefix = (indent * level)
    if is_terminal(node):
        terminal = ' '.join(repr(arg) for arg in args) if args else 'None'
        return prefix + "[" + ntype + " " + terminal + "]"
    return prefix + "[" + ntype + "\n" + "\n".join(
        print_node(n, indent, level + 1) for n in args
    ) + "\n" + prefix + "]"

def is_terminal(node):
    if not node or len(node) < 3:
        return True
    meta, ntype, arg = node[:3]
    return not (type(arg) == list or arg == None)

def simplify_node(node):
    if not node:
        return node
    if is_terminal(node) or len(node) < 3:
        return node[1:]
    args = node[2:]
    return [ node[1], *[simplify_node(n) for n in args] ]