const Parser = require("./Parser");
const Lexer = require("./Lexer");
const Config = require("./Config");
const fs = require("fs");
const { scope_analysis } = require("./ScopeAnalysis");
const { format_error, format_warning } = require("./ErrorHandling");
const { format_bold_status, Status } = require("./Messaging");

// Compilation Pipeline
function compile_to_ir(source) {

    // Source
    //  -> Lex
    //  -> Parse
    let ast;
    try {
        ast = Parser.parse(Lexer.lex(source));
    } catch(error) {
        return { errors: [ error ], warnings: [] };
    }
    const compilation_ctx = { ast, errors: [], warnings: [] };

    // Analysis
    //  -> Scope Analysis
    scope_analysis(compilation_ctx);

    // Desugar
    //  -> 

    return compilation_ctx;
}

function cli(args) {
    const [ file ] = args;
    const source = fs.readFileSync(file, { encoding: "utf8" });

    const start = Date.now();
    const { errors, warnings } = compile_to_ir(source);
    const end = Date.now();

    for (const error of errors) {
        console.log(format_error(file, source, error));
    }
    for (const warning of warnings) {
        console.log(format_warning(file, source, warning));
    }
    console.log(format_bold_status(Status.Error, "Errors: ") + errors.length);
    console.log(format_bold_status(Status.Warn, "Warnings: ") + warnings.length);
    console.log(format_bold_status(Status.Info, "Time: " ) + (end - start) + " (ms)");
}

if (require.main === module) {
    cli(process.argv.slice(2));
}

module.exports = {
    compile_to_ir,
    cli,
};