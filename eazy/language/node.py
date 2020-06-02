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
    whileexp = "whileexp"       # (whilexp condition block)
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