export default class MetaData {
    constructor(gun, room, socketId, callback) {
        this.room = room;
        this.root = gun;
        this.socketId = socketId;
        this.callback = callback;
        this.inMap = false;
    }

    receiveData(data) {
        if (!data) {
            return
        } else {
            if (this.callback) {
                this.callback(data);
            }
        }
    }

    initMap() {
        var data = {};
        data.socketId = this.socketId;
        data.pid = this.root._.opt.pid;
        let metaData = this.root.get(this.root._.opt.pid).put(data);
        this.root.get(this.room).set(metaData);
    }

    sendControlData(data) {
        data.event = "control";
        this.send(data);
    }

    sendChatData(data) {
        data.event = "chat";
        this.send(data);
    }

    sendNotificationData(data) {
        data.ts = Date.now();
        data.event = "notification";
        this.send(data);
    }

    send(data) {
        data.socketId = this.socketId;
        data.pid = this.root._.opt.pid;
        data.room = this.room;
        this.root.on("out", {
            metaData: data
        });
    }
}
