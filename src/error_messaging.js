function get_line_metrics(source, error_position) {

    const lines = source.split("\n");
    const before_lines = [];
    const after_lines = [];
    
    let error_line;
    let error_line_number;
    let error_column;
    let position = 0;
    
    for (const line of lines) {
        if (position <= error_position) {
            if (position + line.length >= error_position) {
                error_line = line;
                error_line_number = before_lines.length + 1;
                error_column = error_position - position + 1;
            } else {
                before_lines.push(line);
            }
        } else {
            after_lines.push(line);
        }
        position += line.length + 1;
    }
    return {
        lines,
        before_lines,
        error_line,
        after_lines,
        error_line_number,
        error_column,
    };
}

function create_error_message_for_source({
    filename,
    source,
    error_position,
    error_type,
    error_message,
    preamble_message = "",
    postamble_message = "",
    context_lines = 2,
    show_underline = false,
    underline_length = 1,
    underline_message = "",
}) {
    const line_metrics = get_line_metrics(source, error_position);
    const lines = line_metrics.before_lines.slice(Math.max(line_metrics.before_lines.length - context_lines, 0));
    lines.push(line_metrics.error_line);
    const starting_line_number = (line_metrics.error_line_number - lines.length) + 1;

    const title = `--- ${error_type}: ${error_message} ---\n\n`;

    let preamble = "";
    if (preamble_message) {
        preamble = `${preamble_message}\n\n`
    }

    let postamble = "";
    if (postamble_message) {
        postamble = `\n${postamble_message}\n\n`;
    }

    const location = `File ${filename} at Line ${line_metrics.error_line_number}, Column ${line_metrics.error_column}\n`;

    let context = "";
    let line_number = starting_line_number;
    for (const line of lines) {
        let aligned_line_number = line_number.toString();
        if (aligned_line_number.length < `${line_metrics.error_line_number}`.length) {
            aligned_line_number = ` ${aligned_line_number}`;
        }
        context += ` ${aligned_line_number} | ${line}\n`;
        line_number += 1;
    }

    let underline = "";
    if (show_underline) {
        let prefix = " ".repeat(`${line_metrics.error_line_number}`.length + line_metrics.error_column + 3);
        let squiggle = "^".repeat(underline_length);
        underline = `${prefix}${squiggle} ${underline_message}\n`
    }

    return [
        title,
        preamble,
        location,
        context,
        underline,
        postamble,
    ].join("");
}

module.exports = {
    create_error_message_for_source,
}