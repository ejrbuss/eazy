/**
 * Optimizations to try
 *  - move instruction decoding into their relevant instructions
 *  - create a number_stack so type checking can be avoided on arithmetic (Float64Array)
 *  - branchless code wherever possible (eg. JUMP_IF)
 *  - indirect dispatch
 *  - Put code in a Float64Array
 *  - use if checks on code and number_stack to convince js engine that they are indeed Float64Arrays
 *  - test unifying isr++ to bottom or top of loop
 *  - test different order/branch tech for string/list/map operations
 *  - codegen, generate a list of function calls from opcodes
 */
const Nothing = undefined;

/**
 * Open questions
 *  - function docs (should probably be in debug somehow)
 *  - variable docs (should probably be in debug somehow)
 *  - debug format
 *  - IO
 *  - interop in general (core extensions>? Math, WEB_IO, APP_IO ...?)
 * 
 * Future changes
 *  - Tail call optimization
 */

// VM Statuses
const VM_OK = 0;
const VM_PAUSED = 1;
const VM_STOPPED = 2;
const VM_ERROR = 3;

// Opccodes
const OPCODE_MASK = 0xFF;

// Core                             // Operands
const OP_STOP               = 0x01; // O
const OP_THROW              = 0x02; // XO
const OP_CATCH              = 0x03; // KO
const OP_JUMP               = 0x12; // LO
const OP_JUMP_IF            = 0x13; // XL

// Registers
const OP_ALLOC              = 0x56; // XYO
const OP_MOVE               = 0x10; // XYO
const OP_SWAP               = 0x11; // XYO
const OP_COPY               = 0x12; // XYO

// Arithmetic
const OP_ADD                = 0x20; // XYZO
const OP_SUB                = 0x21; // XYZO
const OP_MUL                = 0x22; // XYZO
const OP_DIV                = 0x23; // XYZO
const OP_POW                = 0x24; // XYZO
const OP_MOD                = 0x25; // XYZO
const OP_AND                = 0x27; // XYZO
const OP_OR                 = 0x26; // XYZO
const OP_NOT                = 0x28; // XYO;

// Comparisons
const OP_EQ                 = 0x30; // XYZO
const OP_NEQ                = 0x31; // XYZO
const OP_IS                 = 0x32; // XYZO
const OP_IS_NOT             = 0x33; // XYZO
const OP_IN                 = 0x34; // XYZO
const OP_NOT_IN             = 0x35; // XYZO
const OP_LT                 = 0x36; // XYZO
const OP_LTE                = 0x37; // XYZO
const OP_GT                 = 0x38; // XYZO
const OP_GTE                = 0x39; // XYZO

// Load/Store
const OP_EXPAND_VARS        = 0x40; // XO
const OP_LOAD               = 0x41; // XLO
const OP_LOAD_NOTHING       = 0x42; // XO
const OP_LOAD_BOOLEAN       = 0x43; // XYO
const OP_LOAD_NUMBER        = 0x44; // XLO
const OP_LOAD_STRING        = 0x45; // XO
const OP_LOAD_LIST          = 0x46; // XO
const OP_LOAD_MAP           = 0x47; // XO

// Collections
const OP_MERGE              = 0x50; // XYZO
const OP_GET                = 0x51; // XYZO
const OP_SET                = 0x52; // XYZO
const OP_PUSH               = 0x53; // XYO
const OP_COUNT              = 0x54; // XYO
const OP_FREEZE             = 0x55; // XO

// Functions
const OP_PUSH_ARG           = 0x60; // XO
const OP_CALL               = 0x61; // KO
const OP_CALL_CLOSURE       = 0x62; // XO
const OP_CALL_EXTENSION     = 0x63; // KO
const OP_RETURN             = 0x64; // XO
const OP_PUSH_ENV           = 0x65; // XO
const OP_CLOSURE            = 0x66; // XLO

// Reflection
const OP_TYPE               = 0x70; // XYO
const OP_DESCRIBE           = 0x71; // XYO
const OP_STACK_TRACE        = 0x72; // XO

// Possible additions
// const OP_TAIL_CALL
// const OP_TAIL_CALL_CLOSURE

// Operands
// X (8) Y (8) Z (8) OPCCODE (8)
const X_MASK  = 0xFF00;
const X_SHIFT = 0x8;
const Y_MASK  = 0xFF0000;
const Y_SHIFT = 0x10;
const Z_MASK  = 0xFF000000;
const Z_SHIFT = 0x18;
// X (8) L (16) OPCODE (8)
const L_MASK  = 0xFFFF0000;
const L_SHIFT = 0x10; 
// K (24) OPCODE (8)
const K_MASK  = 0xFFFFFF00;
const K_SHIFT = 0x8;

class Closure {

    constructor(address, environment) {
        this.address = address;
        this.environment = environment;
    }

}

function run(vm_state) {

    const code = vm_state.code;
    const const_table = vm_state.const_table;

    // Stacks
    const var_stack   = vm_state.var_stack;
    const call_stack  = vm_state.call_stack;
    const arg_stack   = vm_state.arg_stack;
    const env_stack   = vm_state.env_stack;
    const error_stack = vm_state.error_stack;
    const catch_stack = vm_state.catch_stack;

    // Registers
    let isr = vm_state.isr; // instruction register
    let vsr = vm_state.vsr; // variable stack register
    let csr = vm_state.csr; // call stack register
    let vmr = vm_state.vmr; // virtual machine register

    while (vmr === VM_OK) {

        const instruction = code[isr++];
        const opcode = instruction & OPCODE_MASK;
        const x = (instruction & X_MASK) >>> X_SHIFT;
        const y = (instruction & Y_MASK) >>> Y_SHIFT;
        const z = (instruction & Z_MASK) >>> Z_MASK;
        const l = (instruction & L_MASK) >>> L_SHIFT;
        const k = (instruction & K_MASK) >>> K_SHIFT;
        let X, Y, Z, L, K;

        switch (opcode) {

            case OP_STOP:
                vmr = VM_STOPPED;
                break;

            case OP_THROW:
                vmr = VM_ERROR;
                error_stack.push(var_stack[vsr + x]);
                break;
            
            case OP_CATCH:
                catch_stack.push({
                    address: k,
                    var_stack_length: var_stack.length,
                    call_stack_length: call_stack.length,
                });
                break;
            
            case OP_POP_ERROR:
                assert(error_stack.length > 0);
                var_stack[vsr + x] = error_stack.pop();
                break;
            
            case OP_BREAKPOINT:
                vmr = VM_PAUSED;
                break;

            case OP_COPY:
                // TODO make actually copy
                var_stack[vsr + y] = var_stack[vsr + x];
                break;

            case OP_SWAP:
                X = var_stack[vsr + x];
                var_stack[vsr + x] = var_stack[vsr + y];
                var_stack[vsr + y] = X
                break;

            case OP_JUMP:
                isr = l;
                break;

            case OP_JUMP_IF:
                X = var_stack[vsr + x];
                if (typeof X === "boolean" && X) {
                    isr = l;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "only a Boolean is allowed as a condition", {
                        condition: X,
                    }));
                }
                break;

            case OP_ADD:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X + Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator + only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_SUB:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X - Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator - only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_MUL:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X * Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator * only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_DIV:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "number" && typeof Y=== "number") {
                    var_stack[vsr + z] = X / Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator / only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_MOD:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X % Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator % only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_POW:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X ** Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator ^ only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_OR:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "boolean" && typeof Y === "boolean") {
                    var_stack[vsr + z] = X || Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator or only works on Booleans", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_AND:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof X === "boolean" && typeof Y === "boolean") {
                    var_stack[vsr + z] = X && Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator and only works on Booleans", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_OR:
                X = var_stack[vsr + x];
                if (typeof X === "boolean") {
                    var_stack[vsr + y] = !X;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator not only works on Booleans", {
                        operands: [ X ] ,
                    }));
                }
                break;

            case OP_EQ:
                var_stack[vsr + z] = equals(var_stack[vsr + x], var_stack[vsr + y]);
                break;

            case OP_NEQ:
                var_stack[vsr + z] = !equals(var_stack[vsr + x], var_stack[vsr + y]);
                break;

            case OP_IS:
                var_stack[vsr + z] = var_stack[vsr + x] === var_stack[vsr + y];
                break;

            case OP_IS_NOT:
                var_stack[vsr + z] = var_stack[vsr + x] !== var_stack[vsr + y];
                break;

            case OP_IN:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof Y === "string") {
                    if (typeof X === "string") {
                        var_stack[vsr + z] = Y.includes(X);
                    } else {
                        vmr = VM_ERROR;
                        error_stack.push(create_error(vm_state, "TypeError", "operator in expects a String as the first argument when the second argument is a String", {
                            operands: [ X, Y ],
                        }));
                    }
                } else if (Y instanceof Array) {
                    var_stack[vsr + z] = Y.includes(X);
                } else if (Y instanceof Map) {
                    var_stack[vsr + z] = Y.has(X);
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator in only works on strings, lists, and maps", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_NOT_IN:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof Y === "string") {
                    if (typeof X === "string") {
                        var_stack[vsr + z] = !X.includes(Y);
                    } else {
                        vmr = VM_ERROR;
                        error_stack.push(create_error(vm_state, "TypeError", "operator not in expects a String as the first argument when the second argument is a String", {
                            operands: [ X, Y ],
                        }));
                    }
                } else if (Y instanceof Array) {
                    var_stack[vsr + z] = !X.includes(Y);
                } else if (Y instanceof Map) {
                    var_stack[vsr + z] = !X.has(Y);
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "operator not in only works on strings, lists, and maps", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_LT:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X < Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "opterator < only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_LTE:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X <= Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "opterator <= only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_GT:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X > Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "opterator > only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_GTE:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (X === "number" && typeof Y === "number") {
                    var_stack[vsr + z] = X >= Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "opterator >= only works on Numbers", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_LD:
                var_stack[vsr + x] = const_table[l];
                break;

            case OP_LD_NOTHING:
                var_stack[vsr + x] = Nothing;
                break;

            case OP_LD_BOOLEAN:
                var_stack[vsr + x] = y !== 0;
                break;

            case OP_LD_NUMBER:
                var_stack[vsr + x] = l;
                break;

            case OP_LD_STRING:
                var_stack[vsr + x] = "";
                break;

            case OP_LD_LIST:
                var_stack[vsr + x] = [];
                break;

            case OP_LD_MAP:
                var_stack[vsr + x] = new Map();
                break;

            case OP_GET:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                if (typeof Y === "String") {
                    if (typeof X === "number") {
                        var_stack[vsr + z] = Y[X];
                    } else {
                        vmr = VM_ERROR;
                        error_stack.push(create_error(vm_state, "TypeError", "Strings can only be indexed by a Number", {
                            operands: [ X, Y ],
                        }));
                    }
                } else if (Y instanceof Array) {
                    if (typeof X === "number") {
                        var_stack[vsr + z] = Y[X];
                    } else {
                        vmr = VM_ERROR;
                        error_stack.push(create_error(vm_state, "TypeError", "Lists can only be indexed by a Number", {
                            operands: [ X, Y ],
                        }));
                    }
                } else if (Y instanceof Map) {
                    var_sttack[vsr + z] = Y[X];
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "only Strings, Lists, and Maps can be indexed", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_SET:
                X = var_stack[vsr + x];
                Y = var_stack[vsr + y];
                Z = var_stack[vsr + z];
                if (Z instanceof Array) {
                    if (typeof X === "number") {
                        Z[X] = Y;
                    } else {
                        vmr = VM_ERROR;
                        error_stack.push(create_error(vm_state, "TypeError", "Lists can only be indexed by a Number", {
                            operands: [ X, Y ],
                        }));
                    }
                } else if (Y instanceof Map) {
                    Z[X] = Y;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "only Strings, Lists, and Maps can be indexed", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_COUNT:
                X = var_stack[vsr + x];
                if (typeof X === "string") {
                    var_stack[vsr + y] = X.length;
                } else if (X instanceof Array) {
                    var_stack[vsr + y] = X.length;
                } else if (X instanceof Map) {
                    var_stack[vsr + y] = X.size;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "only Strings, Lists, and Maps can be indexed", {
                        operands: [ X, Y ],
                    }));
                }
                break;

            case OP_PUSH_ARG:
                arg_stack.push(var_stack[vsr + x]);
                break;

            case OP_CALL:
                vsr = var_stack.length;
                call_stack.push(isr);
                var_stack.push(...arg_stack);
                arg_stack.length = 0;
                isr = k;
                break;

            case OP_CALL_CLOSURE:
                X = var_stack[vsr + x];
                if (X instanceof Closure) {
                    // TODO save vsr
                    vsr = var_stack.length;
                    call_stack.push(isr);
                    var_stack.push(...X.environment);
                    var_stack.push(...arg_stack);
                    arg_stack.length = 0;
                    isr = X.address;
                } else {
                    vmr = VM_ERROR;
                    error_stack.push(create_error(vm_state, "TypeError", "can only call functions", {
                        operands: [ X ],
                    }));
                }
                break;

            case OP_RETURN:

            // const OP_RETURN         = 0x53; // XO
            // const OP_PUSH_ENV       = 0x54; // XO;
            // const OP_CLOSURE        = 0x55; // LO;
            default:
                assert(false);
        }

        // Try and catch errors
        if (vmr == VM_ERROR) {
            if (catch_stack.length > 0) {
                const catcher = catch_stack.pop();
                isr = catcher.address;
                var_stack.length = catcher.var_stack_length;
                call_stack.length = catcher.call_stack_length;
            }
        }
    }

    // write out registers
    vm_state.isr = isr;
    vm_state.vsr = vsr;
    vm_state.csr = csr;
    vm_state.vmr = vmr;
}

function create_error(vm_state, type, message, data) {
    let debug = vm_state.debug;
    let call_stack = [ ...vm_state.call_stack, vm_state.isr ];
    // TODO map call stack to functions and source line
    return { type, message, stack, ...data };
}

function equals(value1, value2) {
    if (value1 === value2) {
        return true;
    }
    if (typeof value1 !== typeof value2) {
        return false;
    }
    if (value1 instanceof Array) {
        if (!value2 instanceof Array) {
            return false;
        }
        if (value1.length !== value2.length) {
            return false;
        }
        for (let i = 0; i < value1.length; i++) {
            if (!equals(value1[i], value2[i])) {
                return false;
            }
        }
        return true;
    }
    if (value1 instanceof Map) {
        if (!value2 instanceof Map) {
            return false;
        }
        if (value1.size !== value2.size) {
            return false;
        }
        for (let key of value1.keys()) {
            if (!equals(value1.get(ket), value2.get(key))) {
                return false;
            }
        }
        return true;
    }
    return false;
}

module.exports = {
    statuses: {
        VM_OK,
        VM_PAUSED,
        VM_STOPPED,
        VM_ERROR,
    },
    opcodes: {
        OP_STOP,
        OP_THROW,
        OP_CATCH,
        OP_POP_ERROR,
        OP_BREAKPOINT,
        OP_MOVE,
        OP_SWAP,
        OP_COPY,
        OP_JUMP,
        OP_JUMP_IF,

        OP_ADD,
        OP_SUB,
        OP_MUL,
        OP_DIV,
        OP_POW,
        OP_MOD,
        OP_OR,
        OP_AND,
        OP_NOT,

        OP_EQ,
        OP_NEQ,
        OP_IS,
        OP_IS_NOT,
        OP_IN,
        OP_NOT_IN,
        OP_LT,
        OP_LTE,
        OP_GT,
        OP_GTE,

        OP_LD,
        OP_LD_NOTHING,
        OP_LD_BOOLEAN,
        OP_LD_NUMBER,
        OP_LD_STRING,
        OP_LD_LIST,
        OP_LD_MAP,

        OP_GET, 
        OP_SET,
        OP_COUNT,

        OP_PUSH_ARG,
        OP_CALL,
        OP_CALL_CLOSURE,
        OP_RETURN,
        OP_PUSH_ENV,
        OP_CLOSURE,
    }
}