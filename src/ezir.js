const Opcodes = require("./opcodes");

const V = [ ...Array(2 ** 8).keys() ];
const ARGS = V[0];
const CAPS = V[1];

function assemble(ir) {
    // TODO
}

function disassemble(bytecode) {
    // TODO
}

module.exports = {
    ...Opcodes,
    V,
    ARGS,
    CAPS,
    assemble,
    disassemble,
};