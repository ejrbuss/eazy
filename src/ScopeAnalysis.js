const Util = require("util");
const Analysis = require("./Analysis");
const { NodeType, Builtins } = require("./Constants");
const { visit_children } = require("./Analysis");

/*

local_scope: current scope/block
inner_scope: scope for the current function
outer_scope: scope for everything outside the function

We do two passes
 - create scopes and all declarations
 - do a pass for using undeclared variables etc.

The create scopes pass is lazy, it visits outermost scope, then the next 
outermost scope, etc. (breadth-first kinda)

Maybe consider refactoring to actually be breadth-first. However it's less
clear how in that model ScopeOpeners pass a fresh scope to their children

*/

function open_local_scope(scopes) {
    return {
        local_scope: {},
        inner_scope: {
            ...scopes.local_scope,
            ...scopes.inner_scope,
        },
        outer_scope: scopes.outer_scope,
    };
}

function open_inner_scope(scopes) {
    return {
        local_scope: {},
        inner_scope: {},
        outer_scope: {
            ...scopes.local_scope,
            ...scopes.inner_scope,
            ...scopes.outer_scope,
        },
    }
}

function declare_in_local_scope(node) {
    const name = node.value;
    const scopes = node.scopes;
    // Check for redeclaration
    if (name in scopes.local_scope) {
        throw new Error("Variable Redeclaration Error: " + Util.inspect({
            scopes,
            node,
        }));
    }
    scopes.local_scope[name] = {
        declaring_node: node,
        assignments: 0,
        shadowing: false,
        name,
    };
}

const OpensLocalScopeTypes = [
    NodeType.IfExpression,
    NodeType.DoExpression,
    NodeType.WhileExpression,
    NodeType.ForExpression,
    NodeType.TryExpression,
    NodeType.Case,
    NodeType.ElseCase,
];

const OpensInnerScopeTypes = [
    NodeType.Function,
];

const create_scope_visitors = {

    [Analysis.DefaultVisitor]: function(node, ctx) {
        // Create a new scope for scope openers
        if (OpensLocalScopeTypes.includes(node.type)) {
            ctx.unvisited_node_ctx_thunk_pairs.push([node, function() {
                return { ...ctx, scopes: open_local_scope(ctx.scopes) };
            }]);
        } else if (OpensInnerScopeTypes.includes(node.type)) {
            ctx.unvisited_node_ctx_thunk_pairs.push([node, function() {
                return { ...ctx, scopes: open_inner_scope(ctx.scopes) };
            }]);
        } else {
            node.scopes = ctx.scopes;
            Analysis.visit_children(create_scope_visitors, node, ctx);
        }
    },

    [NodeType.Module]: function(node, ctx) {
        node.scopes = ctx.scopes;
        Analysis.visit_children(create_scope_visitors, node, ctx);
        while (ctx.unvisited_node_ctx_thunk_pairs.length > 0) {
            const [ unvisited_node, unvisited_ctx_thunk ] = ctx.unvisited_node_ctx_thunk_pairs.pop();
            const unvisited_ctx = unvisited_ctx_thunk();
            unvisited_node.scopes = unvisited_ctx.scopes;
            Analysis.visit_children(create_scope_visitors, unvisited_node, unvisited_ctx);
        }
    },

    [NodeType.Declaration]: function(node, ctx) {
        node.scopes = ctx.scopes;
        const declaration_ctx = { ...ctx, in_declaration: true };
        Analysis.visit_node(create_scope_visitors, node.pattern, declaration_ctx);
        Analysis.visit_node(create_scope_visitors, node.doc, ctx);
        Analysis.visit_node(create_scope_visitors, node.expression, ctx);
    },

    [NodeType.Identifier]: function(node, ctx) {
        node.scopes = ctx.scopes;
        if (ctx.in_declaration) {
            declare_in_local_scope(node);
        }
    },

    [NodeType.Builtin]: function(node, ctx) {
        node.scopes = ctx.scopes;
        if (ctx.in_declaration) {
            declare_in_local_scope(node);
        }
    },

};

function check_if_in_scope(node) {

    // Builtins are always in scope
    if (Builtins.includes(node.value)) {
        return;
    }

    const name = node.value;
    const scopes = node.scopes;

    if (name in scopes.local_scope) {
        const declaring_node = scopes.local_scope[name].declaring_node;
        // Used before declaration
        if (declaring_node.position > node.position) {
            // TODO better erros
            throw new Error("Variable Undeclared Error: " + Util.inspect({
                scopes,
                node,
            }));
        }
        return;
    }

    if (name in scopes.inner_scope) {
        const declaring_node = scopes.inner_scope[name].declaring_node;
        // Used before declaration
        if (declaring_node.position > node.position) {
            // TODO better erros
            throw new Error("Variable Undeclared Error: " + Util.inspect({
                scopes,
                node,
            }));
        }
        return;
    }

    if (name in scopes.outer_scope) {
        // If the name is in local scope we don't care where it is declared
        return;
    }

    // TODO better erros, eg. "did you mean"
    throw new Error("Variable Undeclared Error: " + Util.inspect({
        scopes,
        node,
    }));
}

function update_scope_declaration(node) {
    const name = node.value;
    const scopes = node.scopes;
    const shadowing = (node.type === NodeType.Builtin
        || name in scopes.inner_scope
        || name in scopes.outer_scope
    );
    scopes.local_scope[name].shadowing = shadowing;
}

function update_scope_assignment(node) {
    const name = node.value;
    const scopes = node.scopes;
    const declaration = (scopes.local_scope[name] 
        || scopes.inner_scope[name]
        || scopes.outer_scope[name]
    );
    declaration.assignments += 1;
}

// Redeclarations, undeclared variables, shadowing, constants
const check_scope_visitor = {
    
    [Analysis.DefaultVisitor]: function(node, ctx) {
        visit_children(check_scope_visitor, node, ctx);
    },

    [NodeType.Declaration]: function(node, ctx) {
        const declaration_ctx = { ...ctx, in_declaration: true };
        Analysis.visit_node(check_scope_visitor, node.pattern, declaration_ctx);
        Analysis.visit_node(check_scope_visitor, node.doc, ctx);
        Analysis.visit_node(check_scope_visitor, node.expression, ctx);
    },

    [NodeType.Assignment]: function(node, ctx) {
        if (node.accesses.length === 0) {
            const assignment_ctx = { ...ctx, in_assignment: true };
            Analysis.visit_node(check_scope_visitor, node.target, assignment_ctx);
        } else {
            Analysis.visit_node(check_scope_visitor, node.target, ctx);
        }
        Analysis.visit_node(check_scope_visitor, node.accesses, ctx);
        Analysis.visit_node(check_scope_visitor, node.expression, ctx);
    },

    [NodeType.Identifier]: function(node, ctx) {
        check_if_in_scope(node);
        if (ctx.in_declaration) {
            update_scope_declaration(node);
        }
        if (ctx.in_assignment) {
            update_scope_assignment(node);
        }
    },

    [NodeType.Builtin]: function(node, ctx) {
        check_if_in_scope(node);
        if (ctx.in_declaration) {
            update_scope_declaration(node);
        }
        if (ctx.in_assignment) {
            update_scope_assignment(node);
        }
    },

};

function scope_analysis(ast) {
    Analysis.visit_node(create_scope_visitors, ast, {
        unvisited_node_ctx_thunk_pairs: [],
        in_declaration: false,
        scopes: {
            local_scope: {},
            inner_scope: {},
            outer_scope: {},
        },
    });
    Analysis.visit_node(check_scope_visitor, ast, {
        in_declaration: false,
        in_assignment: false,
    });
    return ast;
}

module.exports = {
    scope_analysis,
};