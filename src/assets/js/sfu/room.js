import "./mediasoup.js";
import EventEmitter from "../ee.js";
import { Peer } from './peer.js'

export default class Room extends EventEmitter {
    constructor() {
        super();

        this.peer = null;
        this.sendTransport = null;
        this.recvTransport = null;
    }

    join() {
        console.warn("room.join()");
        const wsTransport = new WebSocket("wss://meething.hepic.tel:2345/", "protoo");

        this.peer = new Peer(wsTransport);
        this.peer.on("open", this.onPeerOpen.bind(this));
        this.peer.on("request", this.onPeerRequest.bind(this));
        this.peer.on("notification", this.onPeerNotification.bind(this));
        this.peer.on("failed", console.error);
        this.peer.on("disconnected", console.error);
        this.peer.on("close", console.error);
        this.peer.on("peers", this.onPeers.bind(this));
    }

    async sendAudio(track) {
        console.warn("room.sendAudio()");
        const audioProducer = await this.sendTransport.produce({
            track: track
        });
        audioProducer.on("trackended", async () => {
            console.warn("producer.close() by trackended");
            await this._closeProducer(audioProducer);
        });
        return audioProducer;
    }

    async sendVideo(track) {
        console.warn("room.sendVideo()");
        const videoProducer = await this.sendTransport.produce({
            track: track,
            encodings:
                [
                    { maxBitrate: 90000 },
                    { maxBitrate: 150000 }
                ],
            codecOptions:
            {
                videoGoogleStartBitrate: 1000
            }
        });
        videoProducer.on("trackended", async () => {
            console.warn("producer.close() by trackended");
            await this._closeProducer(videoProducer);
        });
        return videoProducer;
    }

    async onPeerOpen() {
        console.warn("room.peer:open");
        const device = new mediasoupClient.Device();

        const routerRtpCapabilities = await this.peer
            .request("getRouterRtpCapabilities")
            .catch(console.error);
        await device.load({ routerRtpCapabilities });

        await this._prepareSendTransport(device).catch(console.error);
        await this._prepareRecvTransport(device).catch(console.error);

        const res = await this.peer.request("join", {
            rtpCapabilities: device.rtpCapabilities
        });

        this.emit("@open", res);
    }

    async onPeers(res) {
        this.emit("@open", res);
    }

    async _prepareSendTransport(device) {
        const transportInfo = await this.peer
            .request("createWebRtcTransport", {
                producing: true,
                consuming: false
            })
            .catch(console.error);

        const iceServers =
            [{ "urls": ["stun:stun.l.google.com:19302"] }];

        transportInfo.iceServers = iceServers;
        this.sendTransport = device.createSendTransport(transportInfo);
        this.sendTransport.on(
            "connect",
            ({ dtlsParameters }, callback, errback) => {
                console.warn("room.sendTransport:connect");
                this.peer
                    .request("connectWebRtcTransport", {
                        transportId: this.sendTransport.id,
                        dtlsParameters
                    })
                    .then(callback)
                    .catch(errback);
            }
        );
        this.sendTransport.on(
            "produce",
            async ({ kind, rtpParameters, appData }, callback, errback) => {
                console.warn("room.sendTransport:produce");
                try {
                    const { id } = await this.peer.request("produce", {
                        transportId: this.sendTransport.id,
                        kind,
                        rtpParameters,
                        appData
                    });

                    callback({ id });
                } catch (error) {
                    errback(error);
                }
            }
        );
    }

    async _prepareRecvTransport(device) {
        const transportInfo = await this.peer
            .request("createWebRtcTransport", {
                producing: false,
                consuming: true
            })
            .catch(console.error);

        const iceServers =
            [{ "urls": ["stun:stun.l.google.com:19302"] },
            {
                "urls": ["turn:turn.hepic.tel", "turns:turn.hepic.tel"],
                "username": "meething",
                "credential": "b0756813573c0e7f95b2ef667c75ace3",
                "credentialType": "password"
            }
            ]

        transportInfo.iceServers = iceServers;
        this.recvTransport = device.createRecvTransport(transportInfo);
        this.recvTransport.on(
            "connect",
            ({ dtlsParameters }, callback, errback) => {
                console.warn("room.recvTransport:connect");
                this.peer
                    .request("connectWebRtcTransport", {
                        transportId: this.recvTransport.id,
                        dtlsParameters
                    })
                    .then(callback)
                    .catch(errback);
            }
        );
    }

    async _closeProducer(producer) {
        producer.close();
        await this.peer
            .request("closeProducer", { producerId: producer.id })
            .catch(console.error);
        this.emit("@producerClosed", { producerId: producer.id });
    }

    onPeerRequest(req, resolve, reject) {
        console.warn("room.peer:request", req.method);
        switch (req.method) {
            // if you decline this offer, will not request `newConsumer`
            case "newConsumerOffer": {
                const response =
                {
                    response: true,
                    id: req.id,
                    ok: true,
                    data: { accept: true }
                };
                this.peer._transport.send(JSON.stringify(response));
                break;
            }
            case "newConsumer": {
                this.recvTransport
                    .consume(req.data)
                    .then(consumer => {
                        this.emit("@consumer", consumer);
                    })
                    .catch(reject);
                const response =
                {
                    response: true,
                    id: req.id,
                    ok: true,
                    data: { accept: true }
                };
                this.peer._transport.send(JSON.stringify(response));
                break;
            }
            default:
                resolve();
        }
    }

    onPeerNotification(notification) {
        console.warn("room.peer:notification", notification);
        this.emit("@" + notification.method, notification.data);
        if (notification.method == "peerClosed") {
            this.emit("@peerClosed", notification.data.peerId);
        }
    }
}
