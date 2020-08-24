const Language = require("./language");
const { scope_analysis } = require("./ScopeAnalysis");

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

test("ScopeAnalysis.ValidDeclarations", function() {
    scope_analysis(Language.parse_string(`
        let x = 4
        x = 5
    `));
    scope_analysis(Language.parse_string(`
        let x = 4
        x = 5
        do {
            x = 7
            let y = 5
        }
    `));
    scope_analysis(Language.parse_string(`
        let x = 4
        x = 5
        Function {
            y = 7
        }
        let y = 4
    `));
    scope_analysis(Language.parse_string(`
        let count = 5
        count = 6
    `));
    scope_analysis(Language.parse_string(`
        print("Hello, world!")
    `));
    scope_analysis(Language.parse_string(`
        let count = count(List [ 1, 2, 3 ])
    `));
});

test("ScopeAnalysis.UndeclaredErrors", function() {
    expect(function() {
        scope_analysis(Language.parse_string(`
            x = 5
        `))
    }).toThrow();
    expect(function() {
        scope_analysis(Language.parse_string(`
            x = 5
            let x = 6
        `))
    }).toThrow();
    expect(function() {
        scope_analysis(Language.parse_string(`
            let x = 5
            let x = 6
        `))
    }).toThrow();
    expect(function() {
        scope_analysis(Language.parse_string(`
            do {
                x = 5
            }
            let x = 6
        `))
    }).toThrow();
    expect(function() {
        scope_analysis(Language.parse_string(`
            count = 5 
        `))
    }).toThrow();
    expect(function() {
        scope_analysis(Language.parse_string(`
            let x = 4
            do {
                x = 6
                let x = 7
            }
        `))
    }).toThrow();
});

test("ScopeAnalysis.CheckScopes", function() {
    expect(
        remove_declaring_nodes(scope_analysis(Language.parse_string(`
            let w = 4
            Function {
                let x = 6
                do {
                    let x = 6
                    let y = 7 
                    y = 8
                }
                x = 2
                x = x + 1
            }
            let z = 5
        `)).block[1].cases[0].block[1].scopes)
    ).toEqual({
        local_scope: {
            x: {
                name: "x",
                assignments: 0,
                shadowing: true,
            },
            y: {
                name: "y",
                assignments: 1,
                shadowing: false,
            }
        },
        inner_scope: {
            x: {
                name: "x",
                assignments: 2,
                shadowing: false,
            },
        },
        outer_scope: {
            w: {
                name: "w",
                assignments: 0,
                shadowing: false,
            },
            z: {
                name: "z",
                assignments: 0,
                shadowing: false,
            },
        }
    });
});
