const Language = require("./language");
const util = require("util");
const fs = require("fs");
const { 
    scope_analysis,
} = require("./analysis");

function debug(value) {
    fs.writeFileSync("./debug.js", `debug = ${util.inspect(value, { depth: 100 })};`);
    console.log(util.inspect(value, { depth: 100 }));
    return value;
}

test("Analysis.ScopeAnalysis", function() {
    debug(scope_analysis(Language.parse_string(`
        let x = 4
        x = 5
    `)));
});