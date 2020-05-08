import "./mediasoup.js";
import EventEmitter from './ee.js';

export default class Room extends EventEmitter {
    constructor() {
      super();
  
      this.peer = null;
      this.sendTransport = null;
      this.recvTransport = null;
    }
  
    join() {
      console.warn("room.join()");
      const wsTransport = new WebSocketTransport(`ws://localhost:2345`);
  
      this.peer = new Peer(wsTransport);
      this.peer.on("open", this.onPeerOpen.bind(this));
      this.peer.on("request", this.onPeerRequest.bind(this));
      this.peer.on("notification", this.onPeerNotification.bind(this));
      this.peer.on("failed", console.error);
      this.peer.on("disconnected", console.error);
      this.peer.on("close", console.error);
    }
  
    async sendAudio(track) {
      console.warn("room.sendAudio()");
      const audioProducer = await this.sendTransport.produce({
        track
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
        track
      });
      videoProducer.on("trackended", async () => {
        console.warn("producer.close() by trackended");
        await this._closeProducer(videoProducer);
      });
      return videoProducer;
    }
  
    async onPeerOpen() {
      console.warn("room.peer:open");
      const device = new Device();
  
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
  
    async _prepareSendTransport(device) {
      const transportInfo = await this.peer
        .request("createWebRtcTransport", {
          producing: true,
          consuming: false
        })
        .catch(console.error);
  
      // transportInfo.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
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
  
      // transportInfo.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
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
          if (
            confirm(`Do you consume ${req.data.kind} from ${req.data.peerId}?`)
          ) {
            resolve({ accept: true });
            return;
          }
          resolve({ accept: false });
          break;
        }
        case "newConsumer": {
          this.recvTransport
            .consume(req.data)
            .then(consumer => {
              this.emit("@consumer", consumer);
              resolve();
            })
            .catch(reject);
          break;
        }
        default:
          resolve();
      }
    }
  
    onPeerNotification(notification) {
      console.warn("room.peer:notification", notification);
      this.emit("@" + notification.method, notification.data);
    }
  }
  