const { Status, format_message } = require("./Messaging");

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
                        status: Status.Info,
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