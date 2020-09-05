const Desugar = require("./Desugar");
const Parser = require("./Parser");
const Lexer = require("./Lexer");
const { NodeType, visit_all } = require("./Node");

function desugar(transform, source) {
    return discard_position(transform(Parser.parse(Lexer.lex(source))));
}

function discard_position(ast) {
    visit_all(function(node) {
        delete node.position;
        delete node.length; 
    }, ast);
    return ast;
}

test("Desugar.desugar_if", function() {
    expect(desugar(Desugar.desugar_if, `
        if True then { Nothing }
    `)).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.IfExpression,
                condition: { type: NodeType.Boolean, value: true },
                then_block: [ { type: NodeType.Nothing } ],
                else_block: [ { type: NodeType.Nothing, generated: true } ],
            }
        ] },
    );
});