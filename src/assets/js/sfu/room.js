import "./mediasoup.js";
import EventEmitter from "../ee.js";
import { Peer } from './peer.js'
import config from '../config.js';

var self = null;

export default class Room extends EventEmitter {
    constructor() {
        super();


        this.sendTransport = null;
        this.recvTransport = null;

        self = this;
        return this;
    }

    join(roomId, peerId, retry) {
        console.warn("room.join()");

         var peer;

        try {
            // Select SFU Server from config or try self
            if (retry) {
                throw ("Retry");
            }
            var SFU_URL = "wss://" + window.location.hostname + ":2345";
            if(window.location.hostname.indexOf("meething.space") > 0) {
                SFU_URL = `${config.wssFailover}`
            }
            console.log("Joining Local SFU", SFU_URL);
            const wsTransport = new WebSocket(`${SFU_URL}/?roomId=${roomId}&peerId=${peerId}`, "protoo");
            if (wsTransport.readyState == 2 || wsTransport.readyState == 3) { console.error('something not right with webSocket'); throw 'webSocket Local Error'; }
            peer = new Peer(wsTransport);
            console.log('peer', peer._transport._connected, wsTransport.readyState);
            this.checkTimeOut(peer);

        } catch (e) {
            console.log('SFU Failover! Use Remote default');
            var SFU_URL = `${config.wssFailover}`
            const wsTransport = new WebSocket(`${SFU_URL}/?roomId=${roomId}&peerId=${peerId}`, "protoo");
            peer = new Peer(wsTransport);
        }

        peer.on("open", this.onPeerOpen.bind(this, peer));
        peer.on("request", this.onPeerRequest.bind(this, peer));
        peer.on("notification", this.onPeerNotification.bind(this, peer));
        peer.on("failed", console.error);
        peer.on("disconnected", console.error);
        peer.on("close", console.error);
        peer.on("peers", this.onPeers.bind(this, peer));
        peer.on("failed", this.onFailed.bind(this, peer));
        peer.on("timeout", this.onFailed.bind(this, peer));

        console.log(peer.id);
    }

    joinExtraSFU(roomId, peerId, url) {
        const wsTransport = new WebSocket(`${url}/?roomId=${roomId}&peerId=${peerId}`, "protoo");
        if (wsTransport.readyState == 2 || wsTransport.readyState == 3) { console.error('something not right with webSocket'); throw 'webSocket Local Error'; }
        const peer = new Peer(wsTransport);

        peer.on("open", this.onPeerOpen.bind(this, peer));
        peer.on("request", this.onPeerRequest.bind(this, peer));
    }

    checkTimeOut(peer) {
        setTimeout(function () {
            if (peer._transport._connected) {
                console.warn("Connection timeout, connecting to wss seems taking to long force failover");
                self.emit("timeout", { target: peer });
            }
        }, 5000);
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

    async sendScreen(track) {
        console.warn("room.sendScreen()");
        const screenProducer = await this.sendTransport.produce({
            track: track
        });

        screenProducer.on("trackended", async () => {
            console.warn("producer.close() by trackended");
            screenProducer._track.stop();
            screenProducer._track.onended();
            await this._closeProducer(screenProducer);
        });
        return screenProducer;
    }

    async onFailed(event) {
        if (event._connected !== "connected") {
            console.log("Failing retry failback?")
            const params = this.getParams(event._transport.url);
            this.join(params.roomId, params.peerId, true);
        }
    }
    getParams(url) {
        var params = {};
        var parser = document.createElement('a');
        parser.href = url;
        var query = parser.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            params[pair[0]] = decodeURIComponent(pair[1]);
        }
        return params;
    };

    async onPeerOpen(peer) {
        console.warn("room.peer:open");
        const device = new mediasoupClient.Device();

        const routerRtpCapabilities = await peer
            .request("getRouterRtpCapabilities")
            .catch(console.error);
        await device.load({ routerRtpCapabilities });

        await this._prepareSendTransport(peer, device).catch(console.error);
        await this._prepareRecvTransport(peer, device).catch(console.error);

        const res = await peer.request("join", {
            rtpCapabilities: device.rtpCapabilities
        });

        this.emit("@open", res);
    }

    async onPeers(res) {
        this.emit("@open", res);
    }

    async _prepareSendTransport(peer, device) {
        const transportInfo = await peer
            .request("createWebRtcTransport", {
                producing: true,
                consuming: false
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
            ];

        transportInfo.iceServers = iceServers;
        this.sendTransport = device.createSendTransport(transportInfo);
        this.sendTransport.on(
            "connect",
            ({ dtlsParameters }, callback, errback) => {
                console.warn("room.sendTransport:connect");
                peer
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
                    const { id } = await peer.request("produce", {
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

    async _prepareRecvTransport(peer, device) {
        const transportInfo = await peer
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
            ];

        transportInfo.iceServers = iceServers;
        this.recvTransport = device.createRecvTransport(transportInfo);
        this.recvTransport.on(
            "connect",
            ({ dtlsParameters }, callback, errback) => {
                console.warn("room.recvTransport:connect");
                peer
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
        await peer
            .request("closeProducer", { producerId: producer.id })
            .catch(console.error);
        this.emit("@producerClosed", { producerId: producer.id });
    }

    onPeerRequest(peer, req, resolve, reject) {
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
                peer._transport.send(JSON.stringify(response));
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
                peer._transport.send(JSON.stringify(response));
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
        if (notification.method == "consumerClosed") {
            this.emit("@consumerClosed", notification.data.consumerId);
        }
        if (notification.method == "peerJoined") {
            this.emit("@peerJoined", notification.data.peerId);
        }
    }
}
