var self = null;

export default class MetaData {
    constructor(gun, room, socketId, callback) {
        this.room = room;
        this.root = gun;
        this.socketId = socketId;
        this.callback = callback;
        this.inMap = false;
        self = this;

        return this;
    }

    receiveData(data) {
        if (!data) {
            return
        } else {
            if (self.callback) {
                self.callback(data);
            }
        }
    }

    initMap() {
        var data = {};
        data.socketId = self.socketId;
        data.pid = self.root._.opt.pid;
        let metaData = self.root.get(self.root._.opt.pid).put(data);
        self.root.get(self.room).set(metaData);
    }

    sendControlData(data) {
        data.event = "control";
        self.send(data);
    }

    sendChatData(data) {
        data.event = "chat";
        self.send(data);
    }

    sendNotificationData(data) {
        data.ts = Date.now();
        data.event = "notification";
        self.send(data);
    }

    send(data) {
        data.socketId = self.socketId;
        data.pid = self.root._.opt.pid;
        data.room = self.room;
        self.root.on("out", {
            metaData: data
        });
    }
}
