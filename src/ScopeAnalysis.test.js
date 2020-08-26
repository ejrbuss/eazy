import Language from "./language.js";
import { scope_analysis } from "./ScopeAnalysis.js";

function remove_declaring_nodes(scopes) {
    function remove_declaring_nodes(scope) {
        const names = Object.keys(scope);
        for (const name of names) {
            delete scope[name].declaring_node;
        }
    }
    remove_declaring_nodes(scopes.local_scope);
    remove_declaring_nodes(scopes.inner_scope);
    remove_declaring_nodes(scopes.outer_scope);
    return scopes;
}

function expect_analysis(source, no_errors, no_warnings) {
    const analysis = scope_analysis({
        ast: Language.parse_string(source),
        errors: [],
        warnings: [],
    });
    expect(analysis.errors.length).toBe(no_errors);
    expect(analysis.warnings.length).toBe(no_warnings);
}

test("ScopeAnalysis.ValidDeclarations", function() {
    expect_analysis(`
        let x = 4
        print(x)
    `, 0, 0);
    expect_analysis(`
        let x = 4
        let y = 5
        print(x + y)
    `, 0, 0);
    expect_analysis(`
        let x = 4
        do {
            x = 3
            print(x)
        }
        print(x)
    `, 0, 0);
    expect_analysis(`
        Function {
            print(x)
        }
        let x = 4
    `, 0, 0);
    expect_analysis(`
        let x = 4
        do {
            print(x)
        }
        do {
            let y = 7
            Function {
                x = 4
                print(x + y)
            }
        }
        do {
            let y = 7
            print(y)
        }
    `, 0, 0);
});

test("ScopeAnalysis.WarnedDeclarations", function() {
    expect_analysis(`
        let x = 4
    `, 0, 1);
});

test("ScopeAnalysis.ErroredDeclarations", function() {
    expect_analysis(`
        let x = 4
        let x = 5
    `, 1, 1);
    expect_analysis(`
        let count = 4
    `, 1, 1);
    expect_analysis(`
        print(x)
    `, 1, 0);
    expect_analysis(`
        print(x)
        let x = 4
    `, 1, 0);
    expect_analysis(`
        count = 4
    `, 1, 0);
});

test("ScopeAnalysis.ScopeExample", function() {
    expect(remove_declaring_nodes(scope_analysis({
        ast: Language.parse_string(`
            let x = 4
            Function {
                let y = x
                do {
                    let z = 4
                }
                x = y + 1
                print(y)
            }
            print(x)
        `),
        errors: [],
        warnings: [],
    }).ast.block[1].cases[0].block[1].block[0].scopes)).toEqual({
        local_scope: {
            z: {
                name: "z",
                uses: 0,
                assignments: 0,
                redeclarations: [],
            },
        },
        inner_scope: {
            y: {
                name: "y",
                uses: 2,
                assignments: 0,
                redeclarations: [],
            },
        },
        outer_scope: {
            x: {
                name: "x",
                uses: 2,
                assignments: 1,
                redeclarations: [],
            },
        },
    });

});