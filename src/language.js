const Parser = require("./Parser");
const Lexer = require("./Lexer");

// TODO make this better
function parse_string(source, filename) {
    let tokens = Lexer.lex(source);
    let ast = Parser.parse(tokens);
    return ast;
}

module.exports = {
    parse_string,
};