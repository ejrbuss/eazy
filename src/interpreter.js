const ezir = require("./ezir");
const ezvm = require("./ezvm");
const runtime = require("./runtime");

function interpret(vm) {

    // Memory
    const CODE  = vm.CODE;
    const MODS  = vm.MODS;
    const VARS  = vm.VARS;
    const CALLS = vm.CALLS;
    const TRYS  = vm.TRYS;

    // Registers
    let isr = vm.isr;
    let vsr = vm.vsr;
    let csr = vm.csr;
    let err = vm.err;
    let str = vm.str;

    // Module
    let JUMPT = vm.JUMPT;
 
    while (str == ezvm.StatusOk) {

        const [ opcode, ...operands ] = CODE[isr++];

        switch (opcode) {

            case ezir.MODULE: {
                const [ _, _, locals, operations ];
                VARS.length += locals;
                CODE.push(...operations);
                JUMPT = {};
                MODS.push(JUMPT);
                break;
            }

            case ezir.HALT: {
                str = StatusHalted;
                break;
            }

            case ezir.LABEL: {
                const [ label ] = operands;
                JUMPT[label] = isr;
                break;
            }

            case ezir.GOTO: {
                const [ label ] = operands;
                isr = JUMPT[label];
                break;
            }

            case ezir.GOIF: {
                const [ condition, label ] = operands;
                if (VARS[vsr + condition]) {
                    if (!(label in JUMPT)) {
                        // TODO scan ahead for label
                        // Stop if you encounter a MODULE or FUNCTION
                    } 
                    isr = JUMPT[label];
                }
                break;
            }

            case ezir.IMPORT: {
                const [ path, result ] = operands;
                const code = runtime.import(VARS[vsr + path]);
                CALLS[csr++] = result;
                CALLS[csr++] = isr;
                isr = CODE.length;
                CODE.push(...code);
                break;
            }

            default: {
                assert(false);
            }

        }

    }

    // Restore vm state
    vm.JUMPT = JUMPT;
    
    vm.str = str;
    vm.err = err;
    vm.csr = csr;
    vm.vsr = vsr;
    vm.isr = isr;
}