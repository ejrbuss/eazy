import Analysis from "./Analysis.js";
import { NodeType, Builtins } from "./Constants.js";
import { ErrorType, WarningType } from "./ErrorHandling.js";

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

export function get_declaration(name, scopes) {
    if (name in scopes.local_scope) {
        return scopes.local_scope[name];
    }
    if (name in scopes.inner_scope) {
        return scopes.inner_scope[name];
    }
    if (name in scopes.outer_scope) {
        return scopes.outer_scope[name];
    }
}

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
    const { value: name, scopes } = node;
    // Check for declaration and push node onto the redeclaration list
    const declaration = get_declaration(name, scopes);
    if (declaration !== undefined) {
        declaration.redeclarations.push(node);
        return;
    }
    // Otherwise we are safe to create a new declaration
    scopes.local_scope[name] = {
        redeclarations: [],
        declaring_node: node,
        assignments: 0,
        uses: 0,
        name,
    };
}

function update_assignment(node) {
    const declaration = get_declaration(node.value, node.scopes);
    if (declaration !== undefined) {
        declaration.assignments += 1;
    }
}

function update_usage(node) {
    const declaration = get_declaration(node.value, node.scopes);
    if (declaration !== undefined) {
        declaration.uses += 1;
    }
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
        if (OpensLocalScopeTypes.includes(node.type)) {
            ctx.unvisited_node_ctx_thunk_pairs.push([node, function() {
                return { ...ctx, scopes: open_local_scope(ctx.scopes) };
            }]);
            return;
        } 
        if (OpensInnerScopeTypes.includes(node.type)) {
            ctx.unvisited_node_ctx_thunk_pairs.push([node, function() {
                return { ...ctx, scopes: open_inner_scope(ctx.scopes) };
            }]);
            return;
        }
        node.scopes = ctx.scopes;
        Analysis.visit_children(create_scope_visitors, node, ctx);
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

    [NodeType.Pattern]: function(node, ctx) {
        node.scopes = ctx.scopes;
        const declaration_ctx = { ...ctx, in_declaration: true };
        Analysis.visit_children(create_scope_visitors, node, declaration_ctx);
    },

    [NodeType.Assignment]: function(node, ctx) {
        node.scopes = ctx.scopes;
        if (node.accesses.length === 0) {
            const assignment_ctx = { ...ctx, in_assignment: true };
            Analysis.visit_node(create_scope_visitors, node.target, assignment_ctx);
            Analysis.visit_node(create_scope_visitors, node.expression, ctx);
            return;
        }
        Analysis.visit_children(create_scope_visitors, node, ctx);
    },

    [NodeType.Identifier]: function(node, ctx) {
        node.scopes = ctx.scopes;
        if (ctx.in_declaration) {
            declare_in_local_scope(node);
            return;
        }
        if (ctx.in_assignment) {
            update_assignment(node);
            return;
        }
        update_usage(node);
    },

};

function check_declaration(node, ctx) {
    const { value: name, scopes } = node;    
    const declaration = get_declaration(name, scopes);

    // if node is a redeclaration we skip
    // the declaring node will handle the error
    if (node !== declaration.declaring_node) {
        return;
    }

    if (declaration.redeclarations.length !== 0) {
        ctx.errors.push({
            type: ErrorType.Redeclared,
            declaration,
        });
    }

    if (Builtins.includes(name)) {
        ctx.errors.push({
            type: ErrorType.RedeclaredBuiltin,
            declaration,
        });
    }

    if (declaration.uses === 0) {
        ctx.warnings.push({
            type: WarningType.Unused,
            declaration,
        });
    }
}

function check_assignment(node, ctx) {
    // Do the same work as check_usage
    check_usage(node, ctx);

    if (Builtins.includes(node.value)) {
        ctx.errors.push({
            type: ErrorType.AssignedToBuiltin,
            node,
        });
    }
}

function check_usage(node, ctx) {
    const { value: name, scopes } = node;
    const declaration = get_declaration(name, scopes);

    // We don't care about builtin usage
    if (Builtins.includes(name)) {
        return;
    }

    if (declaration === undefined) {
        ctx.errors.push({
            type: ErrorType.Undeclared,
            node,
        });
        return;
    }

    if (name in scopes.local_scope || name in scopes.inner_scope) {
        if (node.position < declaration.declaring_node.position) {
            // we want to update usage data so that we only have the one error
            // in the case of unsued variable
            declaration.uses = Math.max(declaration.uses, 1);
            ctx.errors.push({
                type: ErrorType.UsedBeforeDeclared,
                node,
                declaration,
            });
        }
    }
}

const check_scope_visitors = {
    
    [Analysis.DefaultVisitor]: function(node, ctx) {
        Analysis.visit_children(check_scope_visitors, node, ctx);
    },

    [NodeType.Pattern]: function(node, ctx) {
        const declaration_ctx = { ...ctx, in_declaration: true };
        Analysis.visit_children(check_scope_visitors, node, declaration_ctx);
    },

    [NodeType.Assignment]: function(node, ctx) {
        node.scopes = ctx.scopes;
        if (node.accesses.length === 0) {
            const assignment_ctx = { ...ctx, in_assignment: true };
            Analysis.visit_node(check_scope_visitors, node.target, assignment_ctx);
            Analysis.visit_node(check_scope_visitors, node.expression, ctx);
            return;
        }
        Analysis.visit_children(check_scope_visitors, node, ctx);
    },

    [NodeType.Identifier]: function(node, ctx) {
        if (ctx.in_declaration) {
            check_declaration(node, ctx);
            return;
        }
        if (ctx.in_assignment) {
            check_assignment(node, ctx);
            return;
        }
        check_usage(node, ctx);
    },

};

export function scope_analysis(analysis_ctx) {
    const { ast, errors, warnings } = analysis_ctx;
    Analysis.visit_node(create_scope_visitors, ast, {
        unvisited_node_ctx_thunk_pairs: [],
        in_declaration: false,
        in_assignment: false,
        scopes: {
            local_scope: {},
            inner_scope: {},
            outer_scope: {},
        },
        errors,
        warnings,
    });
    Analysis.visit_node(check_scope_visitors, ast, {
        in_declaration: false,
        in_assignment: false,
        errors,
        warnings,
    });
    return analysis_ctx;
}
