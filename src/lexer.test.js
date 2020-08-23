const Lexer = require("./lexer");
const { Stream } = require("./parsing");
const { NodeType } = require("./constants");

test("Lexer.ExplicitTermiantor", function() {
    expect(Lexer.lex(Stream(";"))).toEqual([
        { type: NodeType.ExplicitTerminator, position: 0, value: ";" },
    ]);
});

test("Lexer.ImplicitTermiantor", function() {
    expect(Lexer.lex(Stream("\n"))).toEqual([
        { type: NodeType.ImplicitTerminator, position: 0, value: "\n" },
    ]);
});

test("Lexer.Whitespace", function() {
    expect(Lexer.lex(Stream(" \t "))).toEqual([
        { type: NodeType.Whitespace, position: 0, value: " \t " },
    ]);
});

test("Lexer.Punctuation", function() {
    expect(Lexer.lex(Stream(",()[]{}"))).toEqual([
        { type: NodeType.Punctuation, position: 0, value: "," },
        { type: NodeType.Punctuation, position: 1, value: "(" },
        { type: NodeType.Punctuation, position: 2, value: ")" },
        { type: NodeType.Punctuation, position: 3, value: "[" },
        { type: NodeType.Punctuation, position: 4, value: "]" },
        { type: NodeType.Punctuation, position: 5, value: "{" },
        { type: NodeType.Punctuation, position: 6, value: "}" },
    ]);
});

test("Lexer.Operator", function() {
    expect(Lexer.lex(Stream("<="))).toEqual([
        { type: NodeType.Operator, position: 0, value: "<=" },
    ]);
});

test("Lexer.Nothing", function() {
    expect(Lexer.lex(Stream("Nothing"))).toEqual([
        { type: NodeType.Nothing, position: 0, value: undefined },
    ])
});

test("Lexer.Boolean", function() {
    expect(Lexer.lex(Stream("True"))).toEqual([
        { type: NodeType.Boolean, position: 0, value: true },
    ]);
    expect(Lexer.lex(Stream("False"))).toEqual([
        { type: NodeType.Boolean, position: 0, value: false },
    ]);
});

test("Lexer.Number", function() {
    expect(Lexer.lex(Stream("0b101"))).toEqual([
        { type: NodeType.Number, position: 0, value: 0b101 },
    ]);
    expect(Lexer.lex(Stream("0o1234567"))).toEqual([
        { type: NodeType.Number, position: 0, value: 0o1234567 },
    ]);
    expect(Lexer.lex(Stream("0x1234_5678_90aB_cDeF"))).toEqual([
        { type: NodeType.Number, position: 0, value: 0x1234567890aBcDeF },
    ]);
    expect(Lexer.lex(Stream("998"))).toEqual([
        { type: NodeType.Number, position: 0, value: 998 },
    ]);
    expect(Lexer.lex(Stream("3.141_59"))).toEqual([
        { type: NodeType.Number, position: 0, value: 3.14159 },
    ]);
});

test("Lexer.String", function() {
    expect(Lexer.lex(Stream("\"Test\""))).toEqual([
        { type: NodeType.String, position: 0, value: "Test" },
    ]);
    expect(Lexer.lex(Stream("\"\ \\\\ \\n \\t \\\" \""))).toEqual([
        { type: NodeType.String, position: 0, value: " \\ \n \t \" " },
    ]);
    expect(Lexer.lex(Stream("'Test'"))).toEqual([
        { type: NodeType.String, position: 0, value: "Test" },
    ]);
    expect(Lexer.lex(Stream("' \\n \\' \\\\' \\ '"))).toEqual([
        { type: NodeType.String, position: 0, value: " \\n ' \\' \\ " },
    ]);
});

test("Lexer.Symbol", function() {
    expect(Lexer.lex(Stream(".symbol_name?"))).toEqual([
        { type: NodeType.Symbol, position: 0, value: ".symbol_name?" },
    ]);
});

test("Lexer.Identifier", function() {
    expect(Lexer.lex(Stream("identifier"))).toEqual([
        { type: NodeType.Identifier, position: 0, value: "identifier" },
    ]);
});

test("Lexer.Builtin", function() {
    expect(Lexer.lex(Stream("List"))).toEqual([
        { type: NodeType.Builtin, position: 0, value: "List" },
    ]);
});

test("Lexer.Doc", function() {
  expect(Lexer.lex(Stream("------let"))).toEqual([
    { type: NodeType.Doc, position: 0, value: "------" },
    { type: NodeType.Keyword, position: 6, value: "let" },
  ]);
});

test("Lexer.general", function () {
    expect(Lexer.lex(Stream(`
        -- Square Function
        let square = Function { x ->
            
        }

        let cube = Function { x ->
            return square(x) * x -- also silly
        }

        for i in 1..10 do {
            IO.print(.cube, .i, cube(i))
        }`
    ))).toEqual([
        { type: 'ImplicitTerminator', position: 0, value: '\n        ' },
        { type: 'Doc', position: 9, value: '-- Square Function' },
        { type: 'ImplicitTerminator', position: 27, value: '\n        ' },
        { type: 'Keyword', position: 36, value: 'let' },
        { type: 'Whitespace', position: 39, value: ' ' },
        { type: 'Identifier', position: 40, value: 'square' },
        { type: 'Whitespace', position: 46, value: ' ' },
        { type: 'Operator', position: 47, value: '=' },
        { type: 'Whitespace', position: 48, value: ' ' },
        { type: 'Builtin', position: 49, value: 'Function' },
        { type: 'Whitespace', position: 57, value: ' ' },
        { type: 'Punctuation', position: 58, value: '{' },
        { type: 'Whitespace', position: 59, value: ' ' },
        { type: 'Identifier', position: 60, value: 'x' },
        { type: 'Whitespace', position: 61, value: ' ' },
        { type: 'Operator', position: 62, value: '->' },
        {
          type: 'ImplicitTerminator',
          position: 64,
          value: '\n            \n        '
        },
        { type: 'Punctuation', position: 86, value: '}' },
        { type: 'ImplicitTerminator', position: 87, value: '\n\n        ' },
        { type: 'Keyword', position: 97, value: 'let' },
        { type: 'Whitespace', position: 100, value: ' ' },
        { type: 'Identifier', position: 101, value: 'cube' },
        { type: 'Whitespace', position: 105, value: ' ' },
        { type: 'Operator', position: 106, value: '=' },
        { type: 'Whitespace', position: 107, value: ' ' },
        { type: 'Builtin', position: 108, value: 'Function' },
        { type: 'Whitespace', position: 116, value: ' ' },
        { type: 'Punctuation', position: 117, value: '{' },
        { type: 'Whitespace', position: 118, value: ' ' },
        { type: 'Identifier', position: 119, value: 'x' },
        { type: 'Whitespace', position: 120, value: ' ' },
        { type: 'Operator', position: 121, value: '->' },
        {
          type: 'ImplicitTerminator',
          position: 123,
          value: '\n            '
        },
        { type: 'Keyword', position: 136, value: 'return' },
        { type: 'Whitespace', position: 142, value: ' ' },
        { type: 'Identifier', position: 143, value: 'square' },
        { type: 'Punctuation', position: 149, value: '(' },
        { type: 'Identifier', position: 150, value: 'x' },
        { type: 'Punctuation', position: 151, value: ')' },
        { type: 'Whitespace', position: 152, value: ' ' },
        { type: 'Operator', position: 153, value: '*' },
        { type: 'Whitespace', position: 154, value: ' ' },
        { type: 'Identifier', position: 155, value: 'x' },
        { type: 'Whitespace', position: 156, value: ' ' },
        { type: 'Comment', position: 157, value: '-- also silly' },
        { type: 'ImplicitTerminator', position: 170, value: '\n        ' },
        { type: 'Punctuation', position: 179, value: '}' },
        { type: 'ImplicitTerminator', position: 180, value: '\n\n        ' },
        { type: 'Keyword', position: 190, value: 'for' },
        { type: 'Whitespace', position: 193, value: ' ' },
        { type: 'Identifier', position: 194, value: 'i' },
        { type: 'Whitespace', position: 195, value: ' ' },
        { type: 'Operator', position: 196, value: 'in' },
        { type: 'Whitespace', position: 198, value: ' ' },
        { type: 'Number', position: 199, value: 1 },
        { type: 'Operator', position: 200, value: '..' },
        { type: 'Number', position: 202, value: 10 },
        { type: 'Whitespace', position: 204, value: ' ' },
        { type: 'Keyword', position: 205, value: 'do' },
        { type: 'Whitespace', position: 207, value: ' ' },
        { type: 'Punctuation', position: 208, value: '{' },
        {
          type: 'ImplicitTerminator',
          position: 209,
          value: '\n            '
        },
        { type: 'Identifier', position: 222, value: 'IO' },
        { type: 'Symbol', position: 224, value: '.print' },
        { type: 'Punctuation', position: 230, value: '(' },
        { type: 'Symbol', position: 231, value: '.cube' },
        { type: 'Punctuation', position: 236, value: ',' },
        { type: 'Whitespace', position: 237, value: ' ' },
        { type: 'Symbol', position: 238, value: '.i' },
        { type: 'Punctuation', position: 240, value: ',' },
        { type: 'Whitespace', position: 241, value: ' ' },
        { type: 'Identifier', position: 242, value: 'cube' },
        { type: 'Punctuation', position: 246, value: '(' },
        { type: 'Identifier', position: 247, value: 'i' },
        { type: 'Punctuation', position: 248, value: ')' },
        { type: 'Punctuation', position: 249, value: ')' },
        { type: 'ImplicitTerminator', position: 250, value: '\n        ' },
        { type: 'Punctuation', position: 259, value: '}' }
      ]);
});