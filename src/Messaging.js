const Config = require("./Config");

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
    if (Config.colors) {
        return styles.join("") + text + Style.Reset;
    }
    return text;
}

function format_status(status, text) {
    return with_styles(text, Foreground[status.color]);
}

function format_inverted_status(status, text=status.name) {
    return with_styles(" " + text + " ", 
        Foreground[status.color], 
        Style.Bright,
        Style.Reverse,
    );
}

function format_bold_status(status, text) {
    return with_styles(text, 
        Foreground[status.color], 
        Style.Bright,
    );
}

function format_title(status, title, subtitle) {
    return [
        format_inverted_status(status),
        format_bold_status(status, title),
        format_status(status, subtitle),
    ].join(" ");
}

function format_text(status, message) {
    return message.replace(/`[^`\n]*`/g, function(match) {
        return format_status(status, match);
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
    const end_line_no = pre_source.split("\n").length - 1;
    const start_line_no = Math.max(end_line_no - lines_of_context, 0);
    const display_line_no_width = (end_line_no + 1).toString().length;

    const pre_lines = pre_source.split("\n");
    pre_lines.pop();
    const position_on_line = position - (pre_lines.join("\n").length + (pre_lines.length > 0 ? 1 : 0));

    const context_lines = lines.slice(start_line_no, end_line_no);
    const span_line     = lines[end_line_no];
    const pre_span      = span_line.substring(0, position_on_line);
    const span          = span_line.substr(position_on_line, length);
    const post_span     = span_line.substring(position_on_line + length);

    const message_parts = [];
    if (prologue && Config.verbose_errors) {
        message_parts.push(format_text(status, prologue));
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
    if (epilogue && Config.verbose_errors) {
        message_parts.push(format_text(status, epilogue));
    }
    return message_parts.join("\n\n");
}

function format_message({
    status,
    title,
    subtitle,
    message,
    code_spans = [],
}) {
    const message_parts = [];
    if (title) {
        message_parts.push(format_title(status, title, subtitle));
    }
    if (message) {
        message_parts.push(format_text(status, message));
    }
    for (const code_span of code_spans) {
        message_parts.push(format_code_span(code_span));
    }
    return "\n" + message_parts.join("\n\n") + "\n";
}

module.exports = {
    Status,
    format_status,
    format_inverted_status,
    format_bold_status,
    format_text,
    format_title,
    format_message,
    format_code_span,
};