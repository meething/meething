
const GUNLogger = "GUNLogger";
const realLog = console.log
const realInfo = console.info
const realWarn = console.warn
const realError = console.error
console.log = log
console.info = warn
console.warn = warn
console.error = error

console.log("GunLogger started");

var peers = ["https://livecodestream-eu.herokuapp.com/gun"];
var opt = { peers: peers, localStorage: false, radisk: false };
const root = Gun(opt);

function log(msg) {
    sent(msg, "log");
    realLog(msg);
}

function info(msg) {
    sent(msg, "info");
    realInfo(msg);
}
function warn(msg) {
    sent(msg, "warn");
    realWarn(msg);
}

function error(msg) {
    sent(msg, "error");
    realError(msg);
}

function sent(msg, level) {
    try {
        if (!isObject(msg)) {
            var data = { event: "log", level: level, message: msg, pid: root._.opt.pid, timestamp: Date.now() }
            let logData = root.get(Date.now()).put(data);
            root.get(GUNLogger).set(logData);
        }
    } catch {
        //Nothing
    }
}

function isObject(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Object;
}
