import EZIR from "./EZIR.js"js";

/*
vm_interface is still kind of undefined

[
    function async import(path)
    function async load_extension(id)
]

*/

function init_vm(interace) {
    return {
        // External interface
        interface,

        // Registers
        isp: 0,
        vsp: 0,
        str: 0,

        // Data
        code: [],
        vars: [],
    };
}

async function eval_source(source, vm) {
    // TODO lex -> parse -> analyse -> codegen -> eval
}


async function eval_ir(ir, vm) {

    let {

        // Registers
        isp,
        vsp,

        // Data
        code,
        vars,

    } = vm;

    // Append ir
    isp = code.length;
    code.push(...ir);

    const OpcodeHandlers = {

        [EZIR.MOVE]: function(v_src, v_dst) {
            vars[vsp + v_dst] = vars[vsp + v_src];
        },

        [EZIR.CONST]: function(constant, v_dst) {
            vars[vsp + v_dst] = Constant;
        },

        [EZIR.EXPAND]: function(locals) {
            vars.length += locals;
        },

    };

}

export default {
    init_vm,
    eval_source,
    eval_ir,
};
