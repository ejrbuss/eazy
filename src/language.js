import Parser from "./Parser.js"
import Lexer from "./Lexer.js";
import { Stream } from "./Parsing.js";

// TODO make this better
function parse_string(source, filename) {
    let tokens = Lexer.lex(Stream(source));
    let ast = Parser.parse(tokens);
    return ast;
}

export default {
    parse_string,
};