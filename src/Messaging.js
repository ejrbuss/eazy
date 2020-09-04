const Config = require("./Config");
const Lexer = require("./Lexer");
const { TokenType } = require("./Node");

const Style = {
    Default: "",
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
};

const Foreground = {
    Default: "",
    Black: "\x1b[30m",
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Yellow: "\x1b[33m",
    Blue: "\x1b[34m",
    Magenta: "\x1b[35m",
    Cyan: "\x1b[36m",
    White: "\x1b[37m",
};

const Background = {
    Default: "",
    Black: "\x1b[40m",
    Red: "\x1b[41m",
    Green: "\x1b[42m",
    Yellow: "\x1b[43m",
    Blue: "\x1b[44m",
    Magenta: "\x1b[45m",
    Cyan: "\x1b[46m",
    White: "\x1b[47m",
};

const Highlight = {
    [TokenType.Doc]: Style.Dim,
    [TokenType.Comment]: Style.Dim,
    [TokenType.Keyword]: Foreground.Magenta,
    [TokenType.Nothing]: Foreground.Yellow,
    [TokenType.Boolean]: Foreground.Yellow,
    [TokenType.Number]: Foreground.Blue,
    [TokenType.String]: Foreground.Green,
};

const Status = {
    Error: {
        name: "Error",
        color: "Red",
    },
    Warn: {
        name: "Warn",
        color: "Yellow",
    },
    Ok: {
        name: "Ok",
        color: "Green",
    },
    Info: {
        name: "Info",
        color: "Blue",
    },
    Debug: {
        name: "Debug",
        color: "Magenta",
    },
};

function with_styles(text, ...styles) {
    if (Config.console_colors) {
        return styles.join("") + text + Style.Reset;
    }
}

function status_message(status, text) {
    return with_styles(text, Foreground[status.color]);
}

function inverted_status_message(status, text) {
    return with_styles(" " + text + " ", 
        Background[status.color], 
        Foreground.Black,
    );
}

function format_title(status, title) {
    return inverted_status_text(` ${status.name} `) + status_text(status, title);
}

function highlight_message(status, message) {
    return message.replace(/`[^`\n]*`/g, function(match) {
        return status_message(status, match);
    });
}

function format_code_span({
    // Required
    file,
    source,
    position,
    length,
    status,
    // Optional
    prologue,
    epilogue,
    annotation = "",
    lines_of_context = 3,
}) {
    const lines = source.split("\n");
    const pre_source = source.substring(0, position);
    const end_line_no = pre_source.split("\n").length;
    const start_line_no = Math.max(end_line_no - lines_of_context, 0);
    const display_line_no_width = (end_line_no + 1).toString().length;

    const pre_lines = pre_source.split("\n");
    pre_lines.pop();
    const position_on_line = position - pre_lines.join("\n").length;

    const context_lines = lines.slice(start_line_no, end_line_no);
    const span_line     = lines[end_line_no];
    const pre_span      = span_line.substring(0, position_on_line);
    const span          = span_line.substr(position_on_line, length);
    const post_span     = span_line.substring(position_on_line + length);

    const message_parts = [];
    if (prologue) {
        message_parts.push(highlight_message(status, prologue));
    }

    let line_no = start_line_no;
    let context = with_styles(file, Style.Dim);
    context += "\n";
    for (const line of context_lines) {
        const display_line_no = (line_no + 1)
            .toString()
            .padStart(display_line_no_width, " ");
        context += with_styles("   " + display_line_no + " | ", Style.Dim);
        context += line;
        context += "\n";
        line_no += 1;
    }
    const display_line_no = (line_no + 1).toString();
    context += with_styles(" > " + display_line_no + " | ", Foreground[status.color]);
    context += pre_span;
    context += with_styles(span, Foreground[status.color]);
    context += post_span;
    context += "\n";
    context += "   ";
    context += " ".repeat(display_line_no_width);
    context += with_styles(" | ", Style.Dim);
    context += " ".repeat(pre_span.length);
    context += with_styles("^".repeat(span.length) + " " + annotation, Foreground[status.color]);
    message_parts.push(context);

    if (epilogue) {
        message_parts.push(highlight_message(status, epilogue));
    }
    return message_parts.join("\n\n");
}

function format_message(
    status,
    title,
    message,
    code_spans = [],
) {
    const message_parts = [];
    if (title) {
        message_parts.push(format_title(status, title));
    }
    if (message) {
        message_parts.push(highlight_message(status, message));
    }
    for (const code_span of code_spans) {
        message_parts.push(format_code_span(code_span));
    }

    return message_lines.join("\n\n");
}

function print_test_page() {
    const { Error, Warn, Ok, Info, Debug } = Status;
    console.log();
    console.log(inverted_status_message(Error, "Error"), status_message(Error, "Error"), "Error");
    console.log(inverted_status_message(Warn,  "Warn "), status_message(Warn,  "Warn "), "Warn ");
    console.log(inverted_status_message(Ok,    " Ok  "), status_message(Ok,    " Ok  "), " Ok  ");
    console.log(inverted_status_message(Info,  "Info "), status_message(Info,  "Info "), "Info ");
    console.log(inverted_status_message(Debug, "Debug"), status_message(Debug, "Debug"), "Debug");
    console.log();
    console.log(`${Style.Dim}File.ez${Style.Reset}`);
    console.log(`${Style.Dim}   31 |${Style.Reset} let position = get_position(entity)`);
    console.log(`${Foreground[Error.color]} > 32 |${Style.Reset} if position then {`);
    console.log(`${Style.Dim}      | ${Style.Reset}${Foreground[Error.color]}   ^^^^^^^^ some information message about this${Style.Reset}`);
    console.log();
    console.log(`${Style.Dim}File.ez${Style.Reset}`);
    console.log(`${Style.Dim}   31 |${Style.Reset} let position = get_position(entity)`);
    console.log(`${Foreground[Warn.color]} > 32 |${Style.Reset} if position then {`);
    console.log(`${Style.Dim}      | ${Style.Reset}${Foreground[Warn.color]}   ^^^^^^^^ some information message about this${Style.Reset}`);
    console.log();
    console.log(`${Style.Dim}File.ez${Style.Reset}`);
    console.log(`${Style.Dim}   31 |${Style.Reset} let position = get_position(entity)`);
    console.log(`${Foreground[Info.color]} > 32 |${Style.Reset} if position then {`);
    console.log(`${Style.Dim}      | ${Style.Reset}${Foreground[Info.color]}   ^^^^^^^^ some information message about this${Style.Reset}`);
    console.log();
    console.log(format_code_span({
        prologue: "I found an error",
        epilogue: "try to fix the `error`",
        file: "file.ez",
        position: 83,
        length: 7,
        status: Error,
        annotation: "`positon` is not defined",
        source:
`let Map [ get_position ] = import("WorldState")







let main = Function {
    let position = get_position(entity)
    if positon > 4 then {
        print(position)
    }
}`
    }));
}

// print_test_page();

module.exports = {
    format_message,
};