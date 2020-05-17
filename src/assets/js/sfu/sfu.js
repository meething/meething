import EventEmitter from "../ee.js";
import Room from "./room.js";
import helper from "../helpers.js"

export default class SFU extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        console.log("SFU::config::%s", JSON.stringify(config));
        this.sfuRoom = new Room();
    }

    init() {
        console.log("SFU::Init");
        if (this.config.autoRequestMedia) {
            // this.startLocalVideo()
        }
        this.sfuRoom.on("@open", ({ peers }) => {
            console.log(`${peers.length} peers in this room.`);
            this.emit("readyToCall");
        });

        this.sfuRoom.on("@consumer", async consumer => {
            const {
                id,
                appData: { peerId },
                track
            } = consumer;
            this.emit("incoming_peer", consumer);

            var video = this.createRemote(consumer);
            if (video) {
                const peer = {
                    video: video,
                    consumer: consumer
                }

                this.emit('videoAdded', peer);
            }
        });

        this.sfuRoom.on("@peerClosed", async id => {
            this.emit("videoRemoved", id);
        });
    }

    joinRoom(room) {
        console.log("SFU::Join %s meething", room);
        this.room = room;
        this.sfuRoom.join(room);
    }

    async startBroadcast() {
        const video = this.config.localVideoEl;
        await this.sfuRoom.sendVideo(video.srcObject.getVideoTracks()[0]);
        await this.sfuRoom.sendAudio(video.srcObject.getAudioTracks()[0]);
        
        // Attach SoundMeter to Local Stream
        if (SoundMeter) {
          // Soundmeter
          window.stream = video.srcObject;
          // console.log('Init Soundmeter.........');
          const soundMeter = new SoundMeter(function () {
            console.log('Imm Speaking! Sending metadata mesh focus...');
            // metaData.sendControlData({ username: username, id: socketId, talking: true });
          });
          soundMeter.connectToSource(window.stream);
        } else { console.error('no soundmeter!'); }
        
    }

    //Move this to a helper?
    startLocalVideo() {
        console.log("SFU::startLocalVideo");
        this.attachMedia();
    }

    //Move this to a helper?
    attachMedia() {
        console.log("SFU::attachMedia");
        const self = this;
        const localVideo = this.config.localVideoEl;

        helper.getUserMedia()
            .then(async stream => {
                if (localVideo) h.setVideoSrc(localVideo, stream);
                self.emit("localStream");

            }).catch(function (error) {
                console.log("Something went wrong!");
                self.emit("localMediaError");
            });
    }

    //Move this to a helper?
    createRemote(consumer) {
        var video = document.getElementById(consumer._appData.peerId + "-video");
        if (video == undefined) {
            video = helper.addVideo(consumer._appData.peerId);
            return video;
        } else {
            return video;
        }
    }
}
