import Lexer from "./Lexer.js";
import { Stream } from "./Parsing.js";
import { TokenType } from "./Constants.js";

function lex(source) {
    return discard_position(Lexer.lex(Stream(source)));
}

function discard_position(ast) {
    if (typeof ast === "object") {
        if (!(ast instanceof Array)) {
            delete ast.position;
            delete ast.length;
        }
        for (const key of Object.keys(ast)) {
            discard_position(ast[key]);
        }
    }
    return ast;
}

test("Lexer.ExplicitTermiantor", function() {
    expect(lex(";")).toEqual([
        { type: TokenType.ExplicitTerminator, value: ";" },
    ]);
});

test("Lexer.ImplicitTermiantor", function() {
    expect(lex("\n")).toEqual([
        { type: TokenType.ImplicitTerminator, value: "\n" },
    ]);
});

test("Lexer.Whitespace", function() {
    expect(lex(" \t ")).toEqual([
        { type: TokenType.Whitespace, value: " \t " },
    ]);
});

test("Lexer.Punctuation", function() {
    expect(lex(",()[]{}")).toEqual([
        { type: TokenType.Punctuation, value: "," },
        { type: TokenType.Punctuation, value: "(" },
        { type: TokenType.Punctuation, value: ")" },
        { type: TokenType.Punctuation, value: "[" },
        { type: TokenType.Punctuation, value: "]" },
        { type: TokenType.Punctuation, value: "{" },
        { type: TokenType.Punctuation, value: "}" },
    ]);
});

test("Lexer.Operator", function() {
    expect(lex("<=")).toEqual([
        { type: TokenType.Operator, value: "<=" },
    ]);
});

test("Lexer.Nothing", function() {
    expect(lex("Nothing")).toEqual([
        { type: TokenType.Nothing, value: undefined },
    ])
});

test("Lexer.Boolean", function() {
    expect(lex("True")).toEqual([
        { type: TokenType.Boolean, value: true },
    ]);
    expect(lex("False")).toEqual([
        { type: TokenType.Boolean, value: false },
    ]);
});

test("Lexer.Number", function() {
    expect(lex("0b101")).toEqual([
        { type: TokenType.Number, value: 0b101 },
    ]);
    expect(lex("0o1234567")).toEqual([
        { type: TokenType.Number, value: 0o1234567 },
    ]);
    expect(lex("0x1234_5678_90aB_cDeF")).toEqual([
        { type: TokenType.Number, value: 0x1234567890aBcDeF },
    ]);
    expect(lex("998")).toEqual([
        { type: TokenType.Number, value: 998 },
    ]);
    expect(lex("3.141_59")).toEqual([
        { type: TokenType.Number, value: 3.14159 },
    ]);
});

test("Lexer.String", function() {
    expect(lex("\"Test\"")).toEqual([
        { type: TokenType.String, value: "Test" },
    ]);
    expect(lex("\"\ \\\\ \\n \\t \\\" \"")).toEqual([
        { type: TokenType.String, value: " \\ \n \t \" " },
    ]);
    expect(lex("'Test'")).toEqual([
        { type: TokenType.String, value: "Test" },
    ]);
    expect(lex("' \\n \\' \\\\' \\ '")).toEqual([
        { type: TokenType.String, value: " \\n ' \\' \\ " },
    ]);
});

test("Lexer.Symbol", function() {
    expect(lex(".symbol_name?")).toEqual([
        { type: TokenType.Symbol, value: ".symbol_name?" },
    ]);
});

test("Lexer.Identifier", function() {
    expect(lex("identifier")).toEqual([
        { type: TokenType.Identifier, value: "identifier" },
    ]);
});

test("Lexer.Doc", function() {
  expect(lex("------let")).toEqual([
    { type: TokenType.Doc, value: "------" },
    { type: TokenType.Keyword, value: "let" },
  ]);
});

test("Lexer.general", function () {
    expect(lex(`
        -- Square Function
        let square = Function { x ->
            
        }

        let cube = Function { x ->
            return square(x) * x -- also silly
        }

        for i in 1..10 do {
            IO.print(.cube, .i, cube(i))
        }`
    )).toEqual([
        { type: 'ImplicitTerminator', value: '\n        ' },
        { type: 'Doc', value: '-- Square Function' },
        { type: 'ImplicitTerminator', value: '\n        ' },
        { type: 'Keyword', value: 'let' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'square' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Operator', value: '=' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'Function' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Punctuation', value: '{' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'x' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Operator', value: '->' },
        { type: 'ImplicitTerminator', value: '\n            \n        ' },
        { type: 'Punctuation', value: '}' },
        { type: 'ImplicitTerminator', value: '\n\n        ' },
        { type: 'Keyword', value: 'let' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'cube' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Operator', value: '=' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'Function' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Punctuation', value: '{' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'x' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Operator', value: '->' },
        { type: 'ImplicitTerminator', value: '\n            ' },
        { type: 'Keyword', value: 'return' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'square' },
        { type: 'Punctuation', value: '(' },
        { type: 'Identifier', value: 'x' },
        { type: 'Punctuation', value: ')' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Operator', value: '*' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'x' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Comment', value: '-- also silly' },
        { type: 'ImplicitTerminator', value: '\n        ' },
        { type: 'Punctuation', value: '}' },
        { type: 'ImplicitTerminator', value: '\n\n        ' },
        { type: 'Keyword', value: 'for' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'i' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Operator', value: 'in' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Number', value: 1 },
        { type: 'Operator', value: '..' },
        { type: 'Number', value: 10 },
        { type: 'Whitespace', value: ' ' },
        { type: 'Keyword', value: 'do' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Punctuation', value: '{' },
        { type: 'ImplicitTerminator', value: '\n            ' },
        { type: 'Identifier', value: 'IO' },
        { type: 'Symbol', value: '.print' },
        { type: 'Punctuation', value: '(' },
        { type: 'Symbol', value: '.cube' },
        { type: 'Punctuation', value: ',' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Symbol', value: '.i' },
        { type: 'Punctuation', value: ',' },
        { type: 'Whitespace', value: ' ' },
        { type: 'Identifier', value: 'cube' },
        { type: 'Punctuation', value: '(' },
        { type: 'Identifier', value: 'i' },
        { type: 'Punctuation', value: ')' },
        { type: 'Punctuation', value: ')' },
        { type: 'ImplicitTerminator', value: '\n        ' },
        { type: 'Punctuation', value: '}' }
      ]);
});
