function check_is_parser(parser) {
    if (parser === undefined) {
        throw new TypeError("No parser provided!");
    }
    if (typeof parser !== "function") {
        throw new TypeError("Not a parser: " + parser);
    }
}

export function Stream(data) {
    return { position: 0, data };
}

function Parser(parsing_function) {
    check_is_parser(parsing_function);
    return function(stream) {
        const checkpoint = stream.position;
        const result = parsing_function(stream);
        if (result === false) {
            stream.error_position = stream.position;
            stream.position = checkpoint;
            return false;
        }
        return result;
    };
}

function pass(stream) {
    return true;
}

function fail(stream) {
    return false;
}

function literal(literal) {
    return function(stream) {
        if (stream.data.startsWith(literal, stream.position)) {
            stream.position += literal.length;
            return literal;
        }
        stream.error_position = stream.position;
        return false;
    };
}

function regex(regex) {
    return function(stream) {
        const rest = stream.data.substring(stream.position);
        const match = rest.match(regex);
        if (match) {
            stream.position += match[0].length;
            return Array.from(match);
        }
        stream.error_position = stream.position;
        return false;
    };
}

function next(stream) {
    if (done(stream)) {
        return false;
    }
    return stream.data[stream.position++];
}

function done(stream) {
    return stream.position >= stream.data.length;
}

function all(parser) {
    check_is_parser(parser);
    return map_to_nth(0, sequence(
        parser,
        done,
    ));
}

function lazy(lazy_parser) {
    check_is_parser(lazy_parser);
    let parser;
    return function(stream) {
        if (!parser) {
            parser = lazy_parser();
        }
        return parser(stream);
    }
}

function sequence(...parsers) {
    parsers.forEach(check_is_parser);
    return function(stream) {
        const checkpoint = stream.position;
        const results = [];
        for (const parser of parsers) {
            const result = parser(stream);
            if (result === false) {
                stream.error_position = stream.position;
                stream.position = checkpoint;
                return false;
            }
            results.push(result);
        }
        return results;
    };
}

function named_sequence(...names_and_parsers) {
    const parsers = [];
    const index_name_pairs = [];
    let index = 0;
    while (names_and_parsers.length > 0) {
        const name_or_parser = names_and_parsers.shift();
        if (typeof name_or_parser === "string") {
            index_name_pairs.push([ index++, name_or_parser ]);
            parsers.push(names_and_parsers.shift());
        } else {
            index++;
            parsers.push(name_or_parser);
        }
    }
    parsers.forEach(check_is_parser);
    return map(function(results) {
        const result = {};
        for (const [ index, name ] of index_name_pairs) {
            result[name] = results[index];
        }
        return result;
    }, sequence(...parsers));
}

function choice(...parsers) {
    parsers.forEach(check_is_parser);
    return function(stream) {
        for (const parser of parsers) {
            const result = parser(stream);
            if (result !== false) {
                return result;
            }
        }
        stream.error_position = stream.position;
        return false;
    };
}

function many(parser) {
    check_is_parser(parser);
    return function(stream) {
        const results = [];
        let result = parser(stream);
        while (result !== false) {
            results.push(result);
            result = parser(stream);
        }
        return results;
    };
}

function many1(parser) {
    check_is_parser(parser);
    return at_least_n(1, many(parser));
}

function alternate(first_parser, second_parser) {
    check_is_parser(first_parser);
    check_is_parser(second_parser);
    return function(stream) {
        const first_results = [];
        const second_results = [];
        let first_result = first_parser(stream);
        while (first_result !== false) {
            first_results.push(first_result);
            let second_result = second_parser(stream);
            if (second_result === false) {
                first_result = false;
            } else {
                second_results.push(second_result);
                first_result = first_parser(stream);
            }
        }
        return [ first_results, second_results ];
    };
}

function alternate1(first_parser, second_parser) {
    return filter(function(result) {
        return result[0].length > 0;
    }, alternate(first_parser, second_parser));
}

function separate(first_parser, second_parser) {
    check_is_parser(first_parser);
    check_is_parser(second_parser);
    return function(stream) {
        const first_results = [];
        const second_results = [];
        let first_result = first_parser(stream);
        while (first_result !== false) {
            first_results.push(first_result);
            const checkpoint = stream.position;
            let second_result = second_parser(stream);
            if (second_result === false) {
                first_result = false;
            } else {
                first_result = first_parser(stream);
                if (first_result !== false) {
                    second_results.push(second_result);
                } else {
                    stream.position = checkpoint;
                }
            }
        }
        return [ first_results, second_results ];
    };
}

function separate1(first_parser, second_parser) {
    check_is_parser(first_parser);
    check_is_parser(second_parser);
    return filter(function(result) {
        return result[0].length > 0;
    }, separate(first_parser, second_parser));
}

function must(parser, error_metadata) {
    check_is_parser(parser);
    return function(stream) {
        const result = parser(stream);
        if (result === false) {
            const error = new Error("at position: " + stream.error_position+ " data: " + JSON.stringify(stream.data[stream.error_position]));
            Object.assign(error, error_metadata);
            error.stream = stream;
            throw error;
        }
        return result;
    };
}

function maybe(parser, default_result) {
    check_is_parser(parser);
    return function(stream) {
        const result = parser(stream);
        if (result === false) {
            return default_result;
        }
        return result;
    };
}

function map(transform, parser) {
    check_is_parser(parser);
    return function(stream) {
        const position = stream.position;
        const result = parser(stream);
        if (result !== false) {
            const new_result = transform(result, position, stream);
            if (new_result === false) {
                stream.error_position = stream.position;
            }
            return new_result;
        }
        return false;
    };
}

function map_to(value, parser) {
    check_is_parser(parser);
    return map(function() { 
        return value;
    }, parser);
}

function map_to_nth(n, parser) {
    check_is_parser(parser);
    return map(function(result) {
        return result[n];
    }, parser);
}

function map_to_key(key, parser) {
    check_is_parser(parser);
    return map(function(result) {
        return result[key];
    }, parser);
}

function map_into(collection, parser) {
    check_is_parser(parser);
    return map(function(result) {
        return { ...collection, ...result };
    }, parser);
}

function map_error(transform, parser) {
    return function(stream) {
        try {
            return parser(stream);
        } catch(error) {
            return transform(error);
        }
    };
}

function filter(predicate, parser) {
    check_is_parser(parser);
    return map(function(result, position, stream) {
        if (result !== false && predicate(result, position, stream)) {
            return result;
        }
        return false;
    }, parser);
}

function at_least_n(n, parser) {
    check_is_parser(parser);
    return filter(function(result) {
        return result.length >= n; 
    }, parser);
}

export default {
    // Constructors
    Stream,
    Parser,

    // Parsers
    pass,
    fail,
    literal,
    regex,
    next,
    done,

    // Combinators
    all,
    lazy,
    sequence,
    named_sequence,
    choice,
    many,
    many1,
    alternate,
    alternate1,
    separate,
    separate1,
    must,
    maybe,

    // Transforms
    map,
    map_to,
    map_to_nth,
    map_to_key,
    map_into,
    map_error,
    filter,
    at_least_n,
};