const EZIR = require("./EZIR");

const Status = {
    Running: 0,
    Waiting: 1,
    Halted: 2,
    Errored: 3,
};

/*
vm_interface is still kind of undefined

[
    function async import(path)
    function async load_extension(id)
]

*/

function init_vm(iface) {
    return {
        // External interface
        iface,

        // Registers
        isp: 0,
        vsp: 0,
        str: 0,

        // Data
        code: [],
        // Deafult args and captures
        vars: [ [], [] ],
    };
}

function eval_source(source, vm) {
    // TODO lex -> parse -> analyse -> codegen -> eval
}


function eval_ir(ir, vm) {

    // Localize registers
    let isp = vm.isp;
    let vsp = vm.vsp;
    let str = vm.str;

    let code = vm.code;
    let vars = vm.vars;

    // Append ir
    isp = code.length;
    code.push(...ir);

    const OpcodeHandlers = {

        [EZIR.MOVE]: function(v_src, v_dst) {
            vars[vsp + v_dst] = vars[vsp + v_src];
        },

        [EZIR.CONST]: function(constant, v_dst) {
            vars[vsp + v_dst] = constant;
        },

        [EZIR.CLAIM]: function(locals) {
            vars.length += locals;
        },

        [EZIR.HALT]: function() {
            str = Status.Halted;
        },

    };

    while (str === Status.Running) {
        const [ opcode, ...args ] = code[isp++];
        OpcodeHandlers[opcode](...args);
    }

    // Save registers
    vm.isp = isp;
    vm.vsp = vsp;
    vm.str = str;

    return;
}

module.exports = {
    init_vm,
    eval_source,
    eval_ir,
};