import Config from "./Config.js";

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

function format_code_span(
    span, // { file, source, position, length }
    // Optional
    message,
    status,
) {
}

function status_text(status, text) {
    return `${Foreground[status.color]}${Style.Bright}${text}${Style.Reset}`;
}

function inverted_status_text(status, text) {
    return `${Background[status.color]}${Foreground.Black}${Style.Bright} ${text} ${Style.Reset}`;
}

function print_test_page() {
    const { Error, Warn, Ok, Info, Debug } = Status;
    console.log();
    console.log(inverted_status_text(Error, "Error"), status_text(Error, "Error"), "Error");
    console.log(inverted_status_text(Warn,  "Warn "), status_text(Warn,  "Warn "), "Warn ");
    console.log(inverted_status_text(Ok,    " Ok  "), status_text(Ok,    " Ok  "), " Ok  ");
    console.log(inverted_status_text(Info,  "Info "), status_text(Info,  "Info "), "Info ");
    console.log(inverted_status_text(Debug, "Debug"), status_text(Debug, "Debug"), "Debug");
    console.log();
    console.log(`${Style.Dim}File.ez${Style.Reset}`);
    console.log(`${Style.Dim} 31 |${Style.Reset} let position = get_position(entity)`);
    console.log(`${Style.Dim} 32 |${Style.Reset} if position then {`);
    console.log(`${Foreground[Error.color]}          ^^^^^^^^ some error message about this${Style.Reset}`);
    console.log();
    console.log(`${Style.Dim}File.ez${Style.Reset}`);
    console.log(`${Style.Dim} 31 |${Style.Reset} let position = get_position(entity)`);
    console.log(`${Style.Dim} 32 |${Style.Reset} if position then {`);
    console.log(`${Foreground[Warn.color]}          ^^^^^^^^ some warning message about this${Style.Reset}`);
    console.log();
    console.log(`${Style.Dim}File.ez${Style.Reset}`);
    console.log(`${Style.Dim} 31 |${Style.Reset} let position = get_position(entity)`);
    console.log(`${Style.Dim} 32 |${Style.Reset} if position then {`);
    console.log(`${Foreground[Info.color]}          ^^^^^^^^ some information message about this${Style.Reset}`);
    console.log();
}

print_test_page();