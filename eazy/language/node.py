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
ntype_doc = "doc"               # [doc token]
ntype_ident = "ident"           # [ident token]
ntype_string = "string"         # [string token]
ntype_number = "number"         # [number token]

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