const benchmark = new require("benchmark");

const suite = new benchmark.Suite;

// suite.add("Array", () => {
//     const array = new Array(10000);
//     for (let i = 0; i < 1000; i++) {
//         array[i] = i;
//     }
//     for (let i = 0; i < 10000; i++) {
//         array[i] = array[i] * array[Math.floor(Math.random() * 10000)] - array[Math.floor(Math.random() * 10000)];
//     }
//     let sum = 0;
//     for (let i = 0; i < 1000; i++) {
//         sum += array[i];
//     }
// });

// suite.add("Float64Array", () => {
//     const array = new Float64Array(10000);
//     for (let i = 0; i < 1000; i++) {
//         array[i] = i;
//     }
//     for (let i = 0; i < 10000; i++) {
//         array[i] = array[i] * array[Math.floor(Math.random() * 10000)] - array[Math.floor(Math.random() * 10000)];
//     }
//     let sum = 0;
//     for (let i = 0; i < 1000; i++) {
//         sum += array[i];
//     }
// });

const data = [];
for (let i = 0; i < 100000; i++) {
    data[i] = i % 2 === 0 ? 1 : 0;
}

suite.add("switch", () => {
    let sum = 0;
    let dp = 0;
    while (dp < data.length) {
        switch(data[dp++]) {
            case 0:
                sum += 2;
            case 1:
                sum += 3;
        }
    }
    return sum;
});

suite.add("threaded", () => {
    let sum = 0;
    let dp = 0;
    function h0(data) {
        if (dp++ < data.length) {
            return h1;
        }
    }
    function h1(data) {
        if (dp++ < data.length) {
            return h0;
        }
    }
    let h = h0;
    while (h = h(data));
    return sum;
});

suite.on('cycle', function(event) {
    console.log(String(event.target));
});

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
});

suite.run();

console.lo