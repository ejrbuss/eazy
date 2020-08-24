const ezir = require("./ezir");
const { NodeType } = require("./constants");

const version = "dev";

function generate_code(ast, module_path) {
    return generate(ast, {
        module_path,
        version,
        locals: 0,
    });
}

function generate(node, ctx) {
    try {
        return generators[node.type](node, ctx);
    } catch(error) {
        // DEBUG
        if (!error.my_rethrown) {
            console.log("node.type = " + node.type);
            console.log(JSON.stringify(node, null, 2));
            error.my_rethrown = true;
        }
        throw error;
    }
}

function generate_module(node, ctx) {
    const module_code = [];
    for (const statement_node of node.block) {
        module_code.push(...generate(statement_node, ctx));
    }
    module_code.unshift([ ezir.MODULE, ctx.version, ctx.module_path, ctx.locals ]);
    return module_code;
}

function generate_nothing(node, ctx) {
    if (ctx.destination !== undefined) {
        return [
            [ ezir.CONST, ctx.destination, undefined ],
        ];
    }
    return [];
}

const generators = {
    [NodeType.Module]: generate_module,
    [NodeType.Nothing]: generate_nothing,
};

module.exports = {
    generate_code,
};