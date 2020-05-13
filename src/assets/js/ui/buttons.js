export default { loadButtons }

function loadButtons(app) {
    document.getElementById("join_button").
        onclick = function (event) {
            app.emit("join", event);
            this.disabled = true;
        }

    document.getElementById("send_video_button").
        onclick = function (event) {
            app.emit("request_video", event);
            this.disabled = true;
        }
}