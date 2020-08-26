export const ErrorType = {
    // Lexing
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

export const WarningType = {
    // Scope analysis
    Unused: "Unused",

    // Dead code analysis
    DeadCCode: "DeadCode",

    // Pattern analsysis
    NeverMatch: "NeverMatch",

    // Typing
    AlwaysTypeError: "AlwaysTypeError", 
};