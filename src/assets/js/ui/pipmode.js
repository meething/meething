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
                    var firstRemoteVideo = document.getElementsByClassName("remote-video")[0];
                    if (med.h.canReplaceTracks()) {
                        elem.srcObject.replaceVideoTrack(firstRemoteVideo.srcObject.getVideoTracks()[0])
                        elem.srcObject.replaceAudioTrack(firstRemoteVideo.srcObject.getAudioTracks()[0])
                    } else {
                        elem.srcObject = firstRemoteVideo.srcObject;
                    }
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
