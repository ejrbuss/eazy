# eazy

## Testing
```
$ pytest --cov-report term-missing --cov
```

## TODO
 - end keyword for ranges: 1..end
 - Better tokenizing errors
 - Better parsing errors
 - Syntactic analysis
 - Reflection

Keywords
if, then, else, do, while, for, in, match, with, return, throw, extend, try, catch, finally

Data
Nothing, True, False, Boolean, Number, String, List, Map, Function, Generator, Class

# Builtins
import, export, merge, count, copy, print, input, help, type, describe, meta, NaN, Infinity, main, assert

```
import
Returns whatever is exported from path.
 - strict traversal rules
 - only loads once unless reloaded
Function { 
    path => ..., 
    path, Map [ :reload, ... ] => ..., 
}

export
Exports a value
 - can only be called once per module (file)
Function { value -> ... }

merge
Combines two values into a new value, 2nd value overwrites if appropriate
 - merge(List [1, 2, 3], List [4])          --> List [1, 2, 3, 4]
 - merge(Map [ x: 1, y: 1 ], Map [ y: 2 ]   --> Map [ x: 1, y: 2 ])
 - merge("hello", "world")                  --> "hello world"
 - merge(1, 5)                              --> 6
 Type errors for Nothing, True, False, Function, Generator

count
Returns the count of a value
 - count(List [1, 2, 3])        --> 3
 - count(Map [ x:1, y: 1 ])     --> 2
 - count("hello")               --> 5
 - count(4)                     --> 4
 - count(True)                  --> 1
 - count(False)                 --> 0
 - count(Nothing)               --> 0
 - count(Function { x -> x })   --> 1 (function arity)
 - count(generator)             --> expends generator and counts calls

copy
Makes a deep copy of whatever you give it

print
Prints a nice to read version of the thing
 - print("hello")        --> hello
 - print(4)              --> 4
 - print(Nothing)        --> 
 - print(List [1, 2, 3]) --> 1, 2, 3

input
gets users input
Function { prompt -> ... }

help
Returns a general help message and returns the docstring of any value you give 
it

type
returns the type of whatever you give it

describe
prints a nice for debugging version of whatever you give it

meta
used to access meta details of the runtime, evaluate arbitrary code, other dangerous stuff
called with no arguments returns the current environment
 - meta() --> Map [ host: "python", version: "0.0.1" ]
 - meta('''
    # This is python code
    print('hello, world')
 ''')



for x in y while x < y do {
    
}

```

# TODO
 - create error message templtaes that pattern match on
    - finnally
    - yield
    - the parser stack
    - the expected production
    - the preeceeding and proceeding token
    - once a few are matching, just create error messages as you go


-- Some meta programming
var eazy = import("eazy")
var Map [ eval_string, eval, node: t ] = eazy

var x = eval_string("4 + 4")
print(x) --> 8

var y = eval(List [ t.module,
   List [ t.add, 
      List [ t.number, 4 ],
      List [ t.number, 4 ],
   ],
])
print(y) --> 8

print(describe(eazy.language.parse("4 + 4")))
--> List [ "module",
--      List [ "add", 
--          List [ "number", 4 ],
--          List [ "number, 4 ],
--      ],
--  ]


var Shape = Class {}

var Rectangle = Class { width, height ->
   extend Shape()
   if use_object:
      extend Object()
   var width = width
   var height = height
}

r = Rectangle(3, 4)

class.of(r)
Class.instance_of?(r, Rectangle) --> True
Class.instance_of?(r, Shape) --> True


# Potential Additional features
-- default arguments
Function { x, y ...z, sep:"," -> }

-- named arguments
f(1, 2, 3, sep:" ")

-- macros
var compile_time = Function { ast ->
   eazy.language.as_node(eazy.eval(ast))
}
@compile_time(4 + 4)


var Stream = Class {}
var pop = Function {}

exprt(Map [ new: Stream, pop ])

var Stream = import("./stream")
var s = Stream.new()
Stream.pop(s)