const TokenType = {
    Symbol: "Symbol",
    String: "String",
    Number: "Number",
    Boolean: "Boolean",
    Nothing: "Nothing",
    Identifier: "Identifier",
    Keyword: "Keyword",
    Builtin: "Builtin",
    Operator: "Operator",
    Doc: "Doc",
    ExplicitTerminator: "ExplicitTerminator",
    ImplicitTerminator: "ImplicitTerminator",
    Punctuation: "Punctuation",
    Comment: "Comment",
    Whitespace: "Whitespace",
};

const NodeType = {
    ...TokenType,

    // Core
    Module: "Module",
    Declaration: "Declaration",         // Elimnated
    Declarations: "Declarations",
    DeDeclaration: "DeDeclaration",
    Assignment: "Assignment",
    Pair: "Pair",                       // Eliminated
    Case: "Case",                       // Eliminated
    ElseCase: "ElseCase",               // Eliminated
    Pattern: "Pattern",                 // Eliminated
    Spread: "Spread",                   // Eliminated

    // Control flow
    Return: "Return",
    Throw: "Throw",
    IfExpression: "IfExpression",
    DoExpression: "DoExpression",       // Eliminated
    WhileExpression: "WhileExpression",
    MatchExpression: "MatchExpression", // Eliminated
    ForExpression: "ForExpression",     // Eliminated
    TryExpression: "TryExpression",

    // Expression
    Call: "Call",
    Builtin: "Builtin",
    ListExpression: "ListExpression",           // Eliminated
    MapExpression: "MapExpression",             // Eliminated
    BoxExpression: "BoxExpression", // Eliminated
    Function: "Function",
};

const Builtin = {
    Halt: "Halt",
    Import: "Import",
    Export: "Export",
    Pos: "Pos",
    Neg: "Neg",
    Add: "Add",
    Sub: "Sub",
    Mul: "Mul",
    Div: "Div",
    Mod: "Mod",
    Pow: "Pow",
    Floor: "Floor",
    Ceil: "Ceil",
    Band: "Band",
    Bor: "Bor",
    Bnot: "Bnot",
    Shl: "Shl",
    Ashr: "Ashr",
    Lshr: "Lshr",
    And: "And",
    Or: "Or",
    Not: "Not",
    Eq: "Eq",
    Noteq: "Noteq",
    Is: "Is",
    Isnot: "Isnot",
    In: "In",
    Notin: "Notin",
    Lt: "Lt",
    Lte: "Lte",
    Gt: "Gt",
    Gte: "Gte",
    Type: "Type",
    Range: "Range",
    Copy: "Copy",
    Merge: "Merge",
    Push: "Push",
    Get: "Get",
    Set: "Set",
    Count: "Count",
    Slice: "Slice",
    Index: "Index",
    Keys: "Keys",
    Values: "Values",
    Freeze: "Freeze",
    Codepoint: "Codepoint",
    Match: "Match",
    Split: "Split",
    Join: "Join",
    Extension: "Extension",
    Break: "Break",
    Trace: "Trace",
};

function is_node(node) {
    return typeof node === "object"
        && !Array.isArray(node)
        && node.type in NodeType;
}

function is_token(node) {
    return is_node(node) 
        && node.type in TokenType;
}

function visit(visitors, node, ctx) {
    const visitor = visitors[node.type];
    if (typeof visitor === "function") {
        visitor(node, ctx);
    } else {
        visit_children(transformers, nnode, ctx);
    }
}

function visit_children(visitors, node, ctx) {
    const keys = Object.kets(node);
    for (const key of keys) {
        const sub_node = node[key];

        if (is_node(sub_node)) {
            visit(visitors, sub_node, ctx);

        } else if (Array.isArray(sub_node)) {
            for (const sub_sub_node of sub_node) {
                if (is_nnode(sub_sub_node)) {
                    visit(visitors, sub_sub_node, ctx);
                }
            }
        }
    }
}

function transform(transformers, node, ctx) {
    const transformer = transformers[node.type];
    if (typeof transformer === "function") {
        return transformer(node, ctx);
    } else {
        return transform_children(transformers, node, ctx);
    }
}

function transform_children(transformers, node, ctx) {
    const transformed_node = { ...node };
    const keys = Object.kets(transformed_node);
    for (const key of keys) {
        const sub_node = transformed_node[key];

        if (is_node(sub_node)) {
            transformed_node[key] = transform(transformers, sub_node, ctx);

        } else if (Array.isArray(sub_node)) {
            const transformed_sub_node = [];
            for (const sub_sub_node of sub_node) {
                if (is_nnode(sub_sub_node)) {
                    transformed_sub_node.push(transform(transformers, sub_sub_node, ctx));
                } else {
                    transformed_sub_node.push(sub_sub_node);
                }
            }
            transformed_node[key] = transformed_sub_node;
        }
    }
    return transformed_node;
}

module.exports = {
    TokenType,
    NodeType,
    Builtin,
    is_node,
    is_token,
    visit,
    visit_children,
    transform,
    transform_children,
};