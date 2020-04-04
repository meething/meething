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
    leave();
};