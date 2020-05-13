import Room from "./room.js";

export default class SFU {
    constructor(app) {
        this.room = new Room();
        this.app = app;
    }

    join() {
        this.initRoom()
        this.initApp();
    }

    initRoom() {
        this.room.join();

        this.room.on("@open", ({ peers }) => {
            console.log(`${peers.length} peers in this room.`);
        });

        this.room.on("@consumer", async consumer => {
            const {
                id,
                appData: { peerId },
                track
            } = consumer;
            this.app.emit("incoming_peer", consumer);
        });
    }

    initApp() {
        this.app.on("request_video", async () => {
            const stream = await navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .catch(console.error);

            var videoTrack = stream.getVideoTracks()[0];
            var audioTrack = stream.getAudioTracks()[0];
            await this.room.sendVideo(videoTrack);
            await this.room.sendAudio(audioTrack);
        });
    }
}

