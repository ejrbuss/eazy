const fs = require("fs");
const Parser = require("./parser");
const Lexer = require("./lexer");
const { Stream } = require("./parsing");
const error_messaging = require("./error_messaging");

function parse_file(path) {
    return parse_string(fs.readFileSync(path));
}

// TODO make this better
function parse_string(source, filename) {
    let tokens;
    try {
        tokens = Lexer.lex(Stream(source));
    } catch(error) {
        console.log(error_messaging.create_error_message_for_source({
            source,
            filename,
            error_position: error.stream.error_position,
            error_type: "SyntaxError",
            error_message: "unexpected character",
            show_underline: true,
            underline_message: "I did not recognize this character!"
        }));
        throw error;
    }
    let ast;
    try {
        ast = Parser.parse(tokens);
    } catch(error) {
        const error_token = error.stream.data[error.stream.error_position];
        console.log(error_messaging.create_error_message_for_source({
            source,
            filename,
            error_position: error_token.position,
            error_type: "SyntaxError",
            error_message: "unexpected token",
            show_underline: true,
            underline_message: "I did not expect this token!",
            underline_length: error_token.length,
        }));
        throw error;
    }
    return ast;
}

module.exports = {
    parse_file,
    parse_string,
};