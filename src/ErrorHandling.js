const { Status, format_message, format_inverted_status, format_bold_status } = require("./Messaging");

const ErrorType = {
    // Lexing
    UnexpectedCharacters: "UnexpectedCharacters",
    UnexpectedToken: "UnexpectedToken",

    // Parinsg
    UnmatchedSeperators: "UnmatchedSeperators",
    ExpectedToken: "ExpectedToken",
    ExpectedProduction: "ExpectedProduction",

    // Scope analysis
    Redeclared: "Redeclared",
    Undeclared: "Undeclared",
    UsedBeforeDeclared: "UsedBeforeDeclared",
    RedeclaredBuiltin: "RedeclaredBuiltin",
    AssignedToBuiltin: "AssignedToBuiltin",
};

const WarningType = {
    // Scope analysis
    Unused: "Unused",

    // Dead code analysis
    DeadCode: "DeadCode",

    // Pattern analsysis
    NeverMatch: "NeverMatch",

    // Typing
    AlwaysTypeError: "AlwaysTypeError", 
};

const formatters = {

    [ErrorType.UnexpectedCharacters]: function(file, source, error) {
        return format_message({
            status: Status.Error,
            title: "Syntax Error:",
            subtitle: "I found an unexpected character sequence!",
            code_spans: [
                {
                    file,
                    source,
                    position: error.stream.error_position,
                    length: 1,
                    annotation: "I do not understand the characters starting here",
                    status: Status.Error,
                },
            ],
        });
    },

    [ErrorType.UnmatchedSeperators]: function(file, source, error) {
        const seperator_names = {
            "(": "parerthese",
            ")": "parenthese",
            "[": "brace",
            "]": "brace",
            "{": "bracket",
            "}": "breacket",
        };
        if (error.opening) {
            const seperator_name = seperator_names[error.opening.value];
            return format_message({
                status: Status.Error,
                title: "Syntax Error:",
                subtitle: "I found an unmatched " + seperator_name + "!",
                code_spans: [
                    {
                        file,
                        source,
                        position: error.opening.position, 
                        length: 1,
                        annotation: "I found an opening " + seperator_name + " here",
                        status: Status.Error,
                    },
                    {
                        file,
                        source,
                        position: error.closing.position,
                        length: 1,
                        annotation: "I expected to find a closing " + seperator_name + " before here",
                        status: Status.Error,
                    }
                ],
            });
        } else {
            const seperator_name = seperator_names[error.closing.value];
            return format_message({
                status: Status.Error,
                title: "Syntax Error:",
                subtitle: "I found an umatched " + seperator_name + "!",
                code_spans: [
                    {
                        file,
                        source,
                        position: error.closing.position,
                        length: 1,
                        annotation: "I expected to find an opening " + seperator_name + " before here",
                        epilogue: "It is possible you have too many closing `" + seperator_name + "`s",
                        status: Status.Error,
                    },
                ],
            });
        }
    },

    [ErrorType.UnexpectedToken]: function(file, source, error) {
        const token = error.stream.data[error.stream.error_position];
        return format_message({
            status: Status.Error,
            title: "Syntax Error:",
            subtitle: "I found an unexpected token!",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    annotation: "I could not make sense of this code starting here",
                    status: Status.Error,
                },
            ],
        });
    },

    [ErrorType.ExpectedProduction]: function(file, source, error) {
        const token = error.stream.data[error.stream.position];
        const article = error.production.match(/^[aieou]/i) ? "an" : "a";
        return format_message({
            status: Status.Error,
            title: "Syntax Error:",
            subtitle: "I found an unexpected token!",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    prologue: "I found a `" + token.value + "` where I expected to find " + article + " " + error.production + "!",
                    annotation: "I expected to find " + article + " " + error.production + " starting here",
                    status: Status.Error,
                },
            ],
        });
    },

    [ErrorType.ExpectedToken]: function(file, source, error) {
        const token = error.stream.data[error.stream.position];
        const expected = error.expected_value || error.expected_type;
        return format_message({
            status: Status.Error,
            title: "Syntax Error:",
            subtitle: "I found an unexpected token!",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    annotation: "I expected to find `" + expected + "` but I found this instead",
                    status: Status.Error,
                }
            ],
        });
    },

    [ErrorType.Redeclared]: function(file, source, error) {
        const original_declaration = error.declaration.declaring_node;
        return format_message({
            status: Status.Error,
            title: "Redeclared Varaible:",
            subtitle: "Variable declared more than once!",
            code_spans: [
                {
                    file,
                    source,
                    position: original_declaration.position,
                    length: original_declaration.length,
                    prologue: "You declared the variable `" + original_declaration.value + "` " + (error.declaration.redeclarations.length + 1) + " times.",
                    annotation: "Here was the first declaration",
                    status: Status.Error,
                },
                ...error.declaration.redeclarations.map(function(redeclaration) {
                    return {
                        file,
                        source,
                        position: redeclaration.position,
                        length: redeclaration.length,
                        annotation: "Here is another declaration",
                        status: Status.Error,
                    };
                }),
            ]
        });
    },

    [ErrorType.Undeclared]: function(file, source, error) {
        const token = error.node;
        return format_message({
            status: Status.Error,
            title: "Undeclared Variable:",
            subtitle: "Variable used without beind declared",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    prologue: "You used the variable `" + token.value + "`, but it was never declared",
                    annotation: "Variable used here",
                    epilogue: "You can declare a variable using `let`. For example `let " + token.value + " = Nothing`.",
                    status: Status.Error,
                },
            ],
        });
    },

    [ErrorType.UsedBeforeDeclared]: function(file, source, error) {
        const declaration = error.declaration.declaring_node;
        const usage = error.node;
        return format_message({
            status: Status.Error,
            title: "Used Before Declared",
            subtitle: "Variable used before its declaration",
            code_spans: [
                {
                    file,
                    source,
                    position: usage.position,
                    length: usage.length,
                    prologue: "You used `" + usage.value + "` before declaring it",
                    annotation: "Here is the usage",
                    status: Status.Error,
                },
                {
                    file,
                    source,
                    position: declaration.position,
                    length: declaration.length,
                    prologue: "You declare `" + usage.value + "` later in the file",
                    annotation: "Here is the declaration",
                    status: Status.Error,
                },
            ],
        });
    },

    [ErrorType.RedeclaredBuiltin]: function(file, source, error) {
        const token = error.declaration.declaring_node;
        return format_message({
            status: Status.Error,
            title: "Redeclared Builtin:",
            subtitle: "Builtin redeclared!",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    prologue: "You redeclared the builtin `" + token.value + "`",
                    annotation: "Here is the redeclaration",
                    epilogue: "You cannod declare a variable with the same name as a builtin. Try using a different name, such as `" + token.value + "_`.",
                    status: Status.Error,
                }
            ],
        });
    },

    [ErrorType.AssignedToBuiltin]: function(file, source, error) {
        const token = error.node;
        return format_message({
            status: Status.Error,
            title: "Assigned Builtin:",
            subtitle: "Builtin assigned a value!",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    prologue: "You assigned a value to the builtin `" + token.value + "`",
                    annotation: "Here is the assignment",
                    epilogue: "You cannot assign to a builtin. They are constant.",
                    status: Status.Error,
                }
            ],
        });
    },

    [WarningType.Unused]: function(file, source, warning) {
        const token = warning.declaration.declaring_node;
        return format_message({
            status: Status.Warn,
            title: "Unused Variable:",
            subtitle: "Variable declared but never used!",
            code_spans: [
                {
                    file,
                    source,
                    position: token.position,
                    length: token.length,
                    prologue: "You declared the variable `" + token.value + "`, but never used it",
                    annotation: "Here is the declaration",
                    status: Status.Warn,
                },
            ],
        })
    },

};

function format(file, source, error) {
    if (!(error.type in formatters)) {
        console.log(error);
        throw new Error(`${error.type} not supported yet!`);
    }
    return formatters[error.type](file, source, error);
}

module.exports = {
    ErrorType,
    WarningType,
    format_error: format,
    format_warning: format,
};