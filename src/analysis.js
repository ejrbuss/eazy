const { NodeType, TokenType } = require("./Node");

const DefaultVisitor = "DefaultVisitor";

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
    if (is_node(node)) {
        const visitor = visitors[node.type] || visitors[DefaultVisitor];
        return visitor(node, ctx);
    }
    if (Array.isArray(node)) {
        for (const sub_node of node) {
            if (is_node(sub_node)) {
                return visitor(sub_node, ctx);
            }
        }
    }
}

module.exports = {
    is_token,
    is_node,
    DefaultVisitor,
    visit_children,
    visit_node,
};