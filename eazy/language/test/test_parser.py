from .. import parser
from .. import tokenizer
from .. import node

"""
ntypes = [
    ntype_or,
    ntype_and,
    ntype_neq,
    ntype_eq,
    ntype_is,
    ntype_isnot,
    ntype_lt,
    ntype_lte,
    ntype_gt,
    ntype_gte,
    ntype_in,
    ntype_notin,
    ntype_add,
    ntype_sub,
    ntype_mul,
    ntype_div,
    ntype_not,
    ntype_pos,
    ntype_neg,
    ntype_range,
    ntype_pow,
    ntype_call,
    ntype_ident,
    ntype_string,
    ntype_number,
]
"""

def test_parse_module():
    ast = parser.parse(tokenizer.tokenize(""))
    assert node.simplify_node(ast) == [ node.ntype_module ]

def test_parse_assign():
    ast = parser.parse(tokenizer.tokenize("x = 4"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_assign,
            [ node.ntype_ident, "x" ],
            [ node.ntype_number, 4 ],
        ]
    ]

def test_parse_var():
    ast = parser.parse(tokenizer.tokenize("var pi = 3.14"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_var,
            [ node.ntype_ident, "pi" ],
            [ node.ntype_number, 3.14 ],
            None,
        ]
    ]

def test_parse_var():
    ast = parser.parse(tokenizer.tokenize("return 4"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_return,
            [ node.ntype_number, 4 ],
            None,
        ]
    ]
    ast = parser.parse(tokenizer.tokenize("return 4 if x"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_return,
            [ node.ntype_number, 4 ],
            [ node.ntype_ident, "x" ],
        ]
    ]

def test_parse_spread():
    ast = parser.parse(tokenizer.tokenize("...data"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_spread,
            [ node.ntype_ident, "data"],
        ]
    ]

def test_parse_list():
    ast = parser.parse(tokenizer.tokenize("List [ 1, 2, 3 ]"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_list,
            [ node.ntype_number, 1 ],
            [ node.ntype_number, 2 ],
            [ node.ntype_number, 3 ],
        ]
    ]

def test_parse_map():
    ast = parser.parse(tokenizer.tokenize("Map [ x, y: 2, ['3']: 3 ]"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_map,
            [ node.ntype_pair, [ node.ntype_ident, "x" ], None ],
            [ node.ntype_pair, [ node.ntype_ident, "y" ], [ node.ntype_number, 2 ] ],
            [ node.ntype_pair, [ node.ntype_string, "3" ], [ node.ntype_number, 3 ] ],

        ]
    ]

def test_parse_path():
    ast = parser.parse(tokenizer.tokenize("x.y[1].z[2]"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_path,
            [ node.ntype_path, 
                [ node.ntype_path, 
                    [ node.ntype_path,
                        [ node.ntype_ident, "x" ],
                        [ node.ntype_ident, "y" ],
                    ],
                    [ node.ntype_number, 1 ],
                ],
                [ node.ntype_ident, "z" ],
            ],
            [ node.ntype_number, 2 ],
        ],
    ]

def test_parse_funcntion():
    ast = parser.parse(tokenizer.tokenize("Function {}"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_function ],
    ]
    ast = parser.parse(tokenizer.tokenize("Function { x, y -> z }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_function,
            [ node.ntype_case, 
                [ node.ntype_patterns ,
                    [ node.ntype_ident, "x"],
                    [ node.ntype_ident, "y"],
                ],
                None,
                [ node.ntype_block,
                    [ node.ntype_ident, "z" ],
                ],      
            ],
        ],
    ]
    ast = parser.parse(tokenizer.tokenize("Function { w => x, y if condition => z }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_function,
            [ node.ntype_case, 
                [ node.ntype_patterns,
                    [ node.ntype_ident, "w"],
                ],
                None,
                [ node.ntype_ident, "x" ],
            ],
            [ node.ntype_case,
                [ node.ntype_patterns, 
                    [ node.ntype_ident, "y" ],
                ],
                [ node.ntype_ident, "condition" ],
                [ node.ntype_ident, "z" ],
            ]
        ],
    ]
    ast = parser.parse(tokenizer.tokenize("Function { body }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_function,
            [ node.ntype_case, 
                None,
                None,
                [ node.ntype_block,
                    [ node.ntype_ident, "body" ],
                ],      
            ],
        ],
    ]

def test_parse_map():
    ast = parser.parse(tokenizer.tokenize("Generator { x, List [ y, z ] -> return x }"))
    print(node.print_node(ast))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_generator,
            [ node.ntype_case, 
                [ node.ntype_patterns,
                    [ node.ntype_ident, "x" ],
                    [ node.ntype_list, 
                        [ node.ntype_ident, "y" ],
                        [ node.ntype_ident, "z" ],
                    ],
                ],
                None,
                [ node.ntype_block,
                    [ node.ntype_return,
                        [ node.ntype_ident, "x" ],
                        None,
                    ],
                ],      
            ],
        ]
    ]

def test_parse_if():
    ast = parser.parse(tokenizer.tokenize("if x then { True }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_if,
            [ node.ntype_ident, "x" ],
            [ node.ntype_block, [ node.ntype_ident, "True" ] ],
            None,
        ],
    ]
    ast = parser.parse(tokenizer.tokenize("if x then { True } else { False }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_if,
            [ node.ntype_ident, "x" ],
            [ node.ntype_block, [ node.ntype_ident, "True" ] ],
            [ node.ntype_block, [ node.ntype_ident, "False" ] ],
        ],
    ]
    ast = parser.parse(tokenizer.tokenize("if x then { True } else if y then { False }"))
    print(node.print_node(ast))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_if,
            [ node.ntype_ident, "x" ],
            [ node.ntype_block, [ node.ntype_ident, "True" ] ],
            [ node.ntype_if,
                [ node.ntype_ident, "y" ],
                [ node.ntype_block, [ node.ntype_ident, "False" ] ],
                None,
            ],
        ],
    ]

    def test_parse_extend():
        ast = parser.parse(tokenizer.tokenize("extend x"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_extend, [ node.ntype_ident, "x" ] ]
        ]

    def test_parse_do():
        ast = parser.parse(tokenizer.tokenize("dp { x }"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_block, [ node.ntype_ident, "x" ] ]
        ]

    def test_parse_do():
        ast = parser.parse(tokenizer.tokenize("while x do { y }"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_while, 
                [ node.ntype_ident, "x" ],
                [ node.ntype_block, [ node.ntype_ident, "y" ] ], 
            ],
        ]

    def test_ntype_match():
        ast = parser.parse(tokenizer.tokenize("match x in { y if z => w, else => 5 }"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_match,
                [ node.ntype_ident, "x" ],
                [ node.ntype_case,
                    [ node.ntype_patterns, 
                        [ node.ntype_ident, "y" ], 
                    ],
                    [ node.ntype_ident, "z" ],
                    [ node.ntype_ident, "w" ],
                ],
                [ node.ntype_case, 
                    [ node.ntype_patterns,
                        [ node.ntype_ident, "else" ],
                    ],
                    None,
                    [ node.ntype_number, 5 ],
                ], 
            ],
        ]

    def test_parse_for():
        ast = parser.parse(tokenizer.tokenize("for x in y do { z }"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_for,
                [ node.ntype_ident, "x" ],
                [ node.ntype_ident, "y" ],
                None,
                None,
                [ node.ntype_block, [ node.ntype_ident, "z" ] ],
            ]
        ]
        ast = parser.parse(tokenizer.tokenize("for x in y if x do { z }"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_for,
                [ node.ntype_ident, "x" ],
                [ node.ntype_ident, "y" ],
                [ node.ntype_ident, "x" ],
                None,
                [ node.ntype_block, [ node.ntype_ident, "z" ] ],
            ]
        ]
        ast = parser.parse(tokenizer.tokenize("for x in y if x while z do { z }"))
        assert node.simplify_node(ast) == [ node.ntype_module, 
            [ node.ntype_for,
                [ node.ntype_ident, "x" ],
                [ node.ntype_ident, "y" ],
                [ node.ntype_ident, "x" ],
                [ node.ntype_ident, "z" ],
                [ node.ntype_block, [ node.ntype_ident, "z" ] ],
            ]
        ]

def test_parse_class():
    ast = parser.parse(tokenizer.tokenize("Class { x -> y }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_class,
            [ node.ntype_function,
                [ node.ntype_case, 
                    [ node.ntype_patterns, 
                        [ node.ntype_ident, "x" ],
                    ],
                    None,
                    [ node.ntype_block, [ node.ntype_ident, "y" ] ],
                ],
            ],
        ],
    ]

def test_parse_class():
    ast = parser.parse(tokenizer.tokenize("try { x } catch { y }"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_try,
            [ node.ntype_block, [ node.ntype_ident, "x" ] ],
            [ node.ntype_block, [ node.ntype_ident, "y" ] ],
        ],
    ]

def test_parse_class():
    ast = parser.parse(tokenizer.tokenize("throw x"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_throw,
           [ node.ntype_ident, "x" ],
           None,
        ],
    ]
    ast = parser.parse(tokenizer.tokenize("throw x if y"))
    assert node.simplify_node(ast) == [ node.ntype_module, 
        [ node.ntype_throw,
           [ node.ntype_ident, "x" ],
           [ node.ntype_ident, "y" ],
        ],
    ]