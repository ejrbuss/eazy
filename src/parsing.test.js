const { 
    Stream, 
    literal, 
    regex,
    next,
    done,
    all,
    lazy,
    choice,
    sequence,
    named_sequence,
    many,
    many1,
    alternate,
    alternate1,
    separate,
    separate1,
    must,
    maybe,
    map,
    map_to,
    map_to_nth,
    map_to_key,
    map_into,
    map_error,
    filter,
    at_least_n,
    map_ctx,
    map_ctx_to,
} = require("./Parsing");

test("Parsing.literal", function() {
    expect(literal("abc")(Stream("abcdef"))).toBe("abc");
    expect(literal("abc")(Stream("fedcba"))).toBe(false);
});

test("Parsing.regex", function() {
    expect(regex(/^a+/)(Stream("abcdef"))).toEqual(["a"]);
    expect(regex(/^a+/)(Stream("aaadef"))).toEqual(["aaa"]);
    expect(regex(/^a+/)(Stream("fedcba"))).toEqual(false);

});

test("Parsing.next", function() {
    expect(next(Stream("abc"))).toBe("a");
    expect(next(Stream("cba"))).toBe("c");
    expect(next(Stream(""))).toBe(false);
});

test("Parsing.done", function() {
    expect(done(Stream(""))).toBe(true);
    expect(done({ position: 3, data: "abc" })).toBe(true);
    expect(done(Stream("abc"))).toBe(false);
});

test("Parsing.all", function() {
    const parser = map_to(true, all(literal("a")));
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream("aa"))).toBe(false);
    expect(parser(Stream("ab"))).toBe(false);
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.lazy", function() {
    const parser = map_to(true, lazy(function() {
        return choice(
            done,
            sequence(
                literal("a"),
                parser,
            ),
        );
    }));
    expect(parser(Stream("aaa"))).toBe(true);
    expect(parser(Stream(""))).toBe(true);
    expect(parser(Stream("aaab"))).toBe(false);

});

test("Parsing.sequence", function() {
    const parser = map_to(true, sequence(
        regex(/^a+/),
        regex(/^b/),
        regex(/^\d+/)
    ));
    expect(parser(Stream("aab123"))).toBe(true);
    expect(parser(Stream("ab9"))).toBe(true);
    expect(parser(Stream("aabb"))).toBe(false);
});

test("Parsing.named_sequence", function() {
    const parser = named_sequence(
        "A", literal("a"),
             literal(","),
        "B", literal("b"),
    );
    expect(parser(Stream("a,b,c"))).toEqual({ A: "a", B: "b" });
});

test("Parsing.choice", function() {
    const parser = map_to(true, choice(
        literal("a"),
        literal("bb"),
        literal("ccc"),
    ));
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream("bb"))).toBe(true);
    expect(parser(Stream("cccd"))).toBe(true);
    expect(parser(Stream("cc"))).toBe(false);
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.many", function() {
    const parser = map_to(true, all(many(literal("a"))));
    expect(parser(Stream("aaa"))).toBe(true);
    expect(parser(Stream(""))).toBe(true);
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.many1", function() {
    const parser = map_to(true, many1(literal("a")));
    expect(parser(Stream("aaa"))).toBe(true);
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream(""))).toBe(false);
    expect(parser(Stream("da"))).toBe(false);
});

test("Parsing.alternate", function() {
    const parser = map_to(true, all(alternate(literal("a"), literal("b"))));
    expect(parser(Stream("ababab"))).toBe(true);
    expect(parser(Stream("ababa"))).toBe(true);
    expect(parser(Stream("abaabab"))).toBe(false)
    expect(parser(Stream("ababbab"))).toBe(false);
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.alternate1", function() {
    const parser = map_to(true, alternate1(
        literal("a"), literal("b"),
    ));
    expect(parser(Stream("ababab"))).toBe(true);
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream(""))).toBe(false);
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.separate", function() {
    const parser = map_to(true, all(separate(literal("a"), literal(","))));
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream("a,a,"))).toBe(false)
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.separate1", function() {
    const parser = map_to(true, all(separate1(literal("a"), literal(","))));
    expect(parser(Stream("a,a,a"))).toBe(true);
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream("a,"))).toBe(false);
    expect(parser(Stream(""))).toBe(false);
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.must", function() {
    const parser = map_to(true, must(literal("a")));
    expect(parser(Stream("a"))).toBe(true);
    expect(function() {
        parser(Stream("b"));
    }).toThrow(Error);
});

test("Parsing.maybe", function() {
    const parser = map_to(true, maybe(literal("a")));
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream("d"))).toBe(true);
});

test("Parsing.map", function() {
    const passing_parser = function() { return 7; }
    const failing_parser = function() { return false; }
    const inc = function(d) { return d + 1; };
    expect(map(inc, passing_parser)(Stream([]))).toBe(8);
    expect(map(inc, failing_parser)(Stream([]))).toBe(false);
});

test("Parsing.map_to", function() {
    const parser = map_to("a", literal("b"));
    expect(parser(Stream("b"))).toBe("a");
});

test("Parsing.map_to_nth", function() {
    const parser = map_to_nth(1, sequence(
        literal("a"),
        literal("b"),
        literal("c"),
    ));
    expect(parser(Stream("abc"))).toBe("b");
});

test("Parsing.map_to_key", function() {
    const parser = map_to_key("B", named_sequence(
        "A", literal("a"),
        literal(","),
        "B", literal("b"),
    ));
    expect(parser(Stream("a,b"))).toBe("b");
});

test("Parsing.map_into", function() {
    const parser = map_into({ A: false, C: false }, named_sequence(
        "A", literal("a"),
        literal(","),
        "B", literal("b"),
    ));
    expect(parser(Stream("a,b"))).toEqual({ A: "a", B: "b", C: false });
});

test("Parsing.map_error", function() {
    const parser = map_error(function(error) {
        return error;
    }, must(literal("a")));
    expect(parser(Stream("d"))).toBeInstanceOf(Error);
});

test("Parsing.filter", function() {
    const parser = filter(function(result) {
         return result !== undefined; 
    }, maybe(literal("a")));
    expect(parser(Stream("d"))).toBe(false);
});

test("Parsing.at_lest_n", function() {
    const parser = map_to(true, at_least_n(1, many(literal("a"))));
    expect(parser(Stream("aaa"))).toBe(true);
    expect(parser(Stream("a"))).toBe(true);
    expect(parser(Stream(""))).toBe(false);
    expect(parser(Stream("da"))).toBe(false);
});

test("Parsing.map_ctx", function() {
    const sub_parser = lazy(function() {
        return sequence(
            function(stream, ctx) {
                return literal(ctx.toString())(stream, ctx);
            },
            maybe(map_ctx(function(ctx) {
                return ctx + 1;
            }, sub_parser)),
        );
    });
    const parser = map_to(true, all(sub_parser));

    expect(parser(Stream("0"), 0)).toBe(true);
    expect(parser(Stream("01"), 0)).toBe(true);
    expect(parser(Stream("456789"), 4)).toBe(true);
    expect(parser(Stream("1"), 0)).toBe(false);
    expect(parser(Stream("01235"), 0)).toBe(false);
    expect(parser(Stream("456789"), 5)).toBe(false);
    expect(parser(Stream("c"), 0)).toBe(false);
});

test("Parsing.map_ctx_to", function() {
    const parse_ctx = function(stream, ctx) {
        return literal(ctx)(stream, ctx);
    };
    const parser = map_to(true, all(many(
        choice(
            sequence(
                literal("a"), map_ctx_to("a", parse_ctx),
            ),
            sequence(
                literal("b"), map_ctx_to("b", parse_ctx),
            ),
        )
    )));

    expect(parser(Stream("aa"))).toBe(true);
    expect(parser(Stream("bb"))).toBe(true);
    expect(parser(Stream("aabb"))).toBe(true);
    expect(parser(Stream("bbaaaabbbbbb"))).toBe(true);
    expect(parser(Stream("aab"))).toBe(false);
    expect(parser(Stream("abab"))).toBe(false);
    expect(parser(Stream("c"))).toBe(false);
});