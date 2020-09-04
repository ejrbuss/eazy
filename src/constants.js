const Operators = [
    "is",
    "not",
    "and",
    "or",
    "==",
    "/=",
    "=>",
    "->",
    "=",
    "<=",
    "<",
    ">=",
    ">",
    "+",
    "-",
    "*",
    "/",
    "^",
    "mod",
    "...",
    "..",
    ".",
    "in",
];

const Keywords = [
    "let",
    "as",
    "if",
    "then",
    "else",
    "do",
    "while",
    "for",
    "match",
    "with",
    "return",
    "throw",
    "try",
    "catch",
    "finally",
];

const Builtins = [
    // Values
    "Boolean",
    "Number",
    "String",
    "Symbol",
    "List",
    "Map",
    "Function",
    "Box",
    "Builtin",

    // Predicates
    "Nothing?",
    "Boolean?",
    "True?",
    "False?",
    "Number?",
    "String?",
    "Symbol?",
    "List?",
    "Map?",
    "Function?",
    "Box?",
    "Builtin?",

    // Functions
    "import",
    "export",
    "assert",
    "test",
    "count",
    "copy",
    "merge" ,
    "help",
    "breakpoint",
    "print",
    "input",
    "type",
];

module.exports = {
    Operators,
    Keywords,
    Builtins,
};