const { NodeType, visit, transform, transform_children, is_node } = require("./Node");

function annotate_as_generated(node) {
    if (is_node(node)) {
        node.position = NaN;
        node.length = NaN;
        node.generated = true;
        for (const key of Object.keys(node)) {
            annotate_as_generated(node[key]);
        }
    }
    if (Array.isArray(node)) {
        for (const sub_node of node) {
            annotate_as_generated(sub_node);
        }
    }
    return node;
}

// Transforms all one armed ifs to two armed ifs
const desugar_if_visitors = {

    [NodeType.IfExpression]: function(node) {
        if (node.else_block === undefined) {
            node.else_block = annotate_as_generated([
                { type: NodeType.Nothing },
            ]);
        }
    },

};

function desugar_if(ast) {
    visit(desugar_if_visitors, ast);
    return ast;
}

function desugar(ast) {
    ast = desugar_if(ast);
}

module.exports = {
    desugar_if,
    desugar,
}