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

    sentControlData(data) {
        data.event = "control";
        this.sent(data);
    }

    sentChatData(data) {
        data.event = "chat";
        this.sent(data);
    }

    sentNotificationData(data) {
        data.ts = Date.now();
        data.event = "notification";
        this.sent(data);
    }

    sent(data) {
        data.socketId = this.socketId;
        data.pid = this.root._.opt.pid;
        data.room = this.room;
        this.root.on("out", {
            metaData: data
        });
    }
}
