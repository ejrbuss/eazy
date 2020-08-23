const Lexer = require("./lexer");
const Parser = require("./parser");
const { Stream } = require("./parsing");
const { NodeType } = require("./constants");

function parse(source) {
    return discard_position(Parser.parse(Lexer.lex(Stream(source))));
}

function discard_position(ast) {
    if (typeof ast === "object") {
        ast.position = undefined;
        for (const key of Object.keys(ast)) {
            discard_position(ast[key]);
        }
    }
    return ast;
}

test("Parser.Nothing", function() {
    expect(parse("Nothing")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Nothing },
        ] }
    );
});

test("Parser.Boolean", function() {
    expect(parse("True")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Boolean, value: true },
        ] }
    );
    expect(parse("False")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Boolean, value: false },
        ] }
    );
});

test("Parser.Number", function() {
    expect(parse("3.14")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Number, value: 3.14 },
        ] }
    );
});

test("Parser.String", function() {
    expect(parse("\"Test\"")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.String, value: "Test" },
        ] }
    );
});

test("Parser.Symbol", function() {
    expect(parse(".test")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Symbol, value: ".test" },
        ] }
    );
});

test("Parser.Builtin", function() {
    expect(parse("test")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Builtin, value: "test" },
        ] }
    );
});

test("Parser.Identifier", function() {
    expect(parse("id")).toEqual(
        { type: NodeType.Module, block: [
            { type: NodeType.Identifier, value: "id" },
        ] }
    );
});

test("Parser.Statements", function() {

});
