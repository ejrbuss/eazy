const { NodeType, TokenType } = require("./constants");

const DefaultViistor = "DefaultVisitor";

function is_token(node) {
    return (is_node(node)
        && node.type in TokenType
    );
}

function is_node(node) {
    return (typeof node === "object"
        && !Array.isArray(node)
        && node.type in NodeType
    );
}

function visit_children(visitors, node, ctx) {
    const keys = Object.keys(node);
    for (const key of keys) {
        const value = node[key];
        if (typeof value === "object") {
            if (is_node(value)) {
                visit_node(visitors, value, ctx);
            }
            if (Array.isArray(value)) {
                for (const sub_value of value) {
                    if (is_node(sub_value)) {
                        visit_node(visitors, sub_value, ctx);
                    }
                }
            }
        }
    }
}

function visit_node(visitors, node, ctx) {
    const visitor = visitors[node.type] || visitors[DefaultViistor];
    if (typeof visitor === "function") {
        return visitor(node, ctx);
    }
}

function scope_analysis(ast) {

    const unvisited_nodes = [];

    function open_scope(scope) {
        return {
            locals: {},
            non_locals: {
                ...scope.non_locals,
                ...scope.locals,
            },
        };
    }

    function declare_in_scope(node, scope) {

        const name = node.value;
        const shadowing = node.type === NodeType.Builtin || name in scope.non_locals;
        
        if (name in scope.locals) {
            // TODO better errors
            throw new Error("Variable Redeclaration Error: " + JSON.stringify({
                scope,
                node,
            }));
        }

        scope.locals = {
            declaring_node: node,
            constant: true,
            name,
            shadowing,
        };
    }

    function assign_in_scope(node, scope) {
        check_if_in_scope(node, scope);

        const name = node.value;

        if (!(name in scope.locals || name in scope.non_locals)) {
            // TODO better errors
            new Error("Variable Undeclared Error: " + JSON.stringify({
                scope,
                node,
            }));
        }

        if (name in scope.locals) {
            scope.locals[name].constant = false;
        }
        if (name in scope.non_locals) {
            scope.non_locals[name].constant = false;
        }
    }

    function check_if_in_scope(node, scope) {
        if (node.type === NodeType.Builtin) {
            return true;
        }
        
        const name = node.value;

        if (!(name in scope.locals || name in scope.non_locals)) {
            // TODO better errors
            new Error("Variable Undeclared Error: " + JSON.stringify({
                scope,
                node,
            }));
        }
    }

    const scope_analysis_visitors = {

        [DefaultViistor]: function(node, ctx) {
            node.scope = ctx.scope;
            visit_children(scope_analysis_visitors, node, ctx);
        },

        [NodeType.Module]: function(node, ctx) {
            visit_children(scope_analysis_visitors, node, ctx);
            while (unvisited_nodes.length > 0) {
                visit_node(scope_analysis_visitors, unvisited_nodes.pop(), ctx);
            }
        },

        [NodeType.Declaration]: function(node, ctx) {
            const declaration_ctx = { ...ctx, in_declaration: true };
            visit_node(scope_analysis_visitors, node.pattern, declaration_ctx);
            scope_analysis_visitors[DefaultViistor](node, ctx);
        },

        [NodeType.Assignment]: function(node, ctx) {
            // if assignment to local variables
            if (node.accesses.length === 0) {
                const assignment_ctx = { ...ctx, in_assignment: true };
                visit_node(scope_analysis_visitors, node.identifier, assignment_ctx);
            }
            scope_analysis_visitors[DefaultViistor](node, ctx);
        },

        [NodeType.Identifier]: function(node, ctx) {
            if (ctx.in_declaration) {
                declare_in_scope(node, ctx.scope);
            }
            if (ctx.in_assignment) {
                assign_in_scope(node, ctx.scope);
            }
            check_if_in_scope(node, ctx);
            scope_analysis_visitors[DefaultViistor](node, ctx);
        },

        [NodeType.Builtin]: function(node, ctx) {
            if (ctx.in_declaration) {
                declare_in_scope(node, ctx.scope);
            }
            if (ctx.in_assignment) {
                assign_in_scope(node, ctx.scope);
            }
            scope_analysis_visitors[DefaultViistor](node, ctx);
        },

    };

    visit_node(scope_analysis_visitors, ast, {
        in_declaration: false,
        in_assignment: false,
        scope: {
            locals: {},
            non_locals: {},
        },
    });
    return ast;
}

module.exports = {
    scope_analysis,
}