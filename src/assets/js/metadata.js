export default class MetaData {
    constructor(gun, room, socketId, callback) {
        this.room = room;
        this.root = gun;
        this.socketId = socketId;
        this.init(callback);
    }

    init(callback) {
        this.receiveData(callback);
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

    sentControlData(data) {
        data.event = "control";
        data.socketId = this.socketId;
        data.pid = this.root._.opt.pid;
        let metaData = this.root.get(this.root._.opt.pid).put(data);
        this.root.get(this.room).set(metaData);
    }

    sentChatData(data) {
        data.event = "chat";
        data.socketId = this.socketId;
        data.pid = this.root._.opt.pid;
        let metaData = this.root.get(this.root._.opt.pid).put(data);
        this.root.get(this.room).set(metaData);
    }
}