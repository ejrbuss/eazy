const Interpreter = require("./Interpreter");
const EZIR = require("./EZIR");

const { V, E, ARGS, CAPS } = EZIR;

test("Interpreter.MOVE", function() {
    const vm = Interpreter.init_vm();
    Interpreter.eval_ir([
        [EZIR.CLAIM, 2],
        [EZIR.CONST, 2, E[0]],
        [EZIR.MOVE, E[0], E[1]],
        [EZIR.HALT],
    ], vm);
    expect(vm.vars).toEqual([[], [], 2, 2])
});