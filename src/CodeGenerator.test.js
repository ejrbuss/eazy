const CodeGenerator = require("./CodeGenerator");

const Lexer = require("./Lexer");
const Parser = require("./Parser");
const ScopeAnalysis = require("./ScopeAnalysis");
const EZIR = require("./EZIR");

const { ARGS, REG, V, E } = EZIR;

function generate_from_source(source) {
    const tokens = Lexer.lex(source);
    const ast = Parser.parse(tokens);
    const analysis_ctx = { ast, warnings: [], errors: [] };
    ScopeAnalysis.scope_analysis(analysis_ctx);
    const code = CodeGenerator.generate(ast);
    return code;
}

test("CodeGenerator.Module", function() {
    expect(generate_from_source("")).toEqual([
        [EZIR.CLAIM, 0],
    ]);
});

test("CodeGenerator.Primitives", function() {
    expect(generate_from_source(`
        -- Start of module
        Nothing
        True
        False
        -6.28
        "string"
        .symbol
    `)).toEqual([
        [EZIR.CLAIM, 1],
        [EZIR.CONST, undefined, E[0]],
        [EZIR.CONST, true, E[0]],
        [EZIR.CONST, false, E[0]],
        [EZIR.CONST, -6.28, E[0]],
        [EZIR.CONST, "string", E[0]],
        [EZIR.CONST, Symbol.for("symbol"), E[0]],
    ]);
});

test("CodeGenerator.ListExpression", function() {
    expect(generate_from_source(`
        List [ 
            1, 
            2, 
            3, 
            4,
        ]
    `)).toEqual([
        [EZIR.CLAIM, 2],
        [EZIR.CONST, [], E[0]],
        [EZIR.CONST, 1, E[1]],
        [EZIR.PUSH, E[1], E[0]],
        [EZIR.CONST, 2, E[1]],
        [EZIR.PUSH, E[1], E[0]],
        [EZIR.CONST, 3, E[1]],
        [EZIR.PUSH, E[1], E[0]],
        [EZIR.CONST, 4, E[1]],
        [EZIR.PUSH, E[1], E[0]],
    ]);
});