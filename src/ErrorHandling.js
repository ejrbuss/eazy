const ErrorType = {
    // Lexing
    LargeNumber: "LargeNumber",
    UnexpectedCharacters: "UnexpectedCharacters",

    // Parinsg
    UnexpectedToken: "UnexpectedToken",

    // Scope analysis
    Redeclared: "Redeclared",
    RedeclaredBuiltin: "RedeclaredBuiltin",
    Undeclared: "Undeclared",
    UsedBeforeDeclared: "UsedBeforeDeclared",
    AssignedToBuiltin: "AssignedToBuiltin",
};

const WarningType = {
    // Scope analysis
    Unused: "Unused",

    // Dead code analysis
    DeadCCode: "DeadCode",

    // Pattern analsysis
    NeverMatch: "NeverMatch",

    // Typing
    AlwaysTypeError: "AlwaysTypeError", 
};

module.exports = {
    ErrorType,
    WarningType,
};