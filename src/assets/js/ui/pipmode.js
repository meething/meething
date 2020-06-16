var med = null;
var self = null;

export default class PipMode {
    constructor(mediator) {
        med = mediator;
        self = this;
        window.ee.on("pip-toggled", function () {
            self.toggle()
        });
        return this;
    }

    async toggle() {
        const elem = document.getElementById("pip");
        elem.play();
        if ("pictureInPictureEnabled" in document) {
            try {
                if (!document.pictureInPictureElement) {
                    await elem.requestPictureInPicture();
                    var tempStream = new MediaStream();
                    elem.srcObject = tempStream.remoteStream;
                    elem.srcObject.replaceVideoTrack(document.getElementsByClassName("remote-video")[0].srcObject.getVideoTracks()[0])
                    elem.play();
                } else {
                    document.exitPictureInPicture();
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}
