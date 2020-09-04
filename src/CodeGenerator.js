const { NodeType } = require("./Node");
const EZIR = require("./EZIR");

const { ARGS, CAPS, V, E } = EZIR;

function debug_generate(node, ctx) {
    if (node.type in code_generators) {
        return code_generators[node.type](node, ctx);
    }
    throw new Error("Unsupported node type: " + node.type);
}

function allocate_var_register(ctx) {
    const register = ctx.var_count;
    ctx.var_count += 1;
    ctx.return_register = register;
    return register;
}

function allocate_scratch_register(ctx) {
    const register = 2 + ctx.var_count + ctx.scratch_count;
    ctx.scratch_count += 1;
    ctx.return_register = register;
    return register;
}

function generate_primitive(node, ctx) {
    ctx.ir.push([EZIR.CONST, node.value, allocate_scratch_register(ctx)]);
}

const code_generators = {

    [NodeType.Module]: function(node, ctx) {

        let var_count = Object.keys(node.scopes.local_scope).length;
        let scratch_count = 0;
        
        const claim_position = ctx.ir.length;
        ctx.ir.push([EZIR.CLAIM, 0]);

        for (const block of node.block) {
            const block_ctx = { ...ctx, var_count };
            debug_generate(block, block_ctx);
            scratch_count = Math.max(scratch_count, block_ctx.scratch_count);
        }

        const claim_needed = var_count + scratch_count;
        ctx.ir[claim_position][1] = claim_needed;
    },

    [NodeType.ListExpression]: function(node, ctx) {
        const register = allocate_scratch_register(ctx);
        ctx.ir.push([EZIR.CONST, [], register]);
        let scratch_count = ctx.scratch_count;
        for (const item of node.items) {
            const item_ctx = { ...ctx };
            debug_generate(item, item_ctx);
            ctx.ir.push([EZIR.PUSH, item_ctx.return_register, register]);
            scratch_count = Math.max(scratch_count, item_ctx.scratch_count);
        }
        ctx.scratch_count = scratch_count;
    },

    [NodeType.MapExpression]: function(node, ctx) {
        
    },

    // Primitives
    [NodeType.Nothing]: generate_primitive,
    [NodeType.Boolean]: generate_primitive,
    [NodeType.Number]: generate_primitive,
    [NodeType.String]: generate_primitive,
    [NodeType.Symbol]: generate_primitive,

}

function generate(ast) {
    const generation_ctx = {
        ir: [],
        var_count: 0,
        scratch_count: 0,
        return_register: 0,
    };
    debug_generate(ast, generation_ctx);
    return generation_ctx.ir;
}

module.exports = {
    generate,
}