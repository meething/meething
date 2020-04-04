var peers = ['https://livecodestream-us.herokuapp.com/gun', 'https://livecodestream-eu.herokuapp.com/gun'];
var opt = { peers: peers, localStorage: false, radisk: false };
var gun = Gun(opt);

var pid = sessionStorage.getItem("pid");
const room = "qvdev4";

if (pid == null || pid == undefined) {
    pid = gun._.opt.pid;
    sessionStorage.setItem("pid", pid);
}
const candidates = new Candidates(gun, room)
const meUser = new User(pid, pid);

function leave() {
    console.log("leaving " + meUser.id);
    meUser.online = false;
    candidates.update(meUser);
    candidates.remove(meUser);
}

function enter() {
    console.log("entering " + meUser.id);
    meUser.online = true;
    candidates.add(meUser);
}

window.onload = function (e) {
    enter();
}

window.onunload = window.onbeforeunload = async function () {
    await leave();
};