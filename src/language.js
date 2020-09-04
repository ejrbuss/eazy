const Parser = require("./Parser");
const Lexer = require("./Lexer");
const { Stream } = require("./Parsing");

// TODO make this better
function parse_string(source, filename) {
    let tokens = Lexer.lex(Stream(source));
    let ast = Parser.parse(tokens);
    return ast;
}

module.exports = {
    parse_string,
};