const Language = require("./language");
const CodeGenerator = require("./CodeGenerator");
const ezir = require("./ezir");

function generate(source) {
    return CodeGenerator.generate_code(Language.parse_string(source));
}

test("CodeGenerator.Nothing", function() {
    expect(generate(`
        Nothing
    `)).toEqual([
        [ ezir.MODULE, "dev", undefined, 0, ]
    ]);
    /*
    expect(generate(`
        let x = Nothing
    `)).toEqual([
        [ ezir.MODULE, "dev", undefined, 0, ]
    ]);*/
});