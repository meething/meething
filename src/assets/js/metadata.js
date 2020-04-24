export default class MetaData {
    constructor(gun, room, socketId, callback) {
        this.room = room;
        this.root = gun;
        this.socketId = socketId;
        this.init(callback);
        this.inMap = false;
    }

    init(callback) {
        this.receiveData(callback);
        this.initMap();
    }

    receiveData(callback) {
        this.root.get(this.room).map().on(function (data, id) {
            if (!data) {
                return
            } else {
                if (callback) {
                    callback(data);
                }
            }
        });
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
        data.event = "notification";
        this.sent(data);
    }

    sent(data) {
        data.socketId = this.socketId;
        data.pid = this.root._.opt.pid;
        this.root.get(this.root._.opt.pid).put(data);
    }
}
