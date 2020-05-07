import EventEmitter from './ee.js';
import uihelper from './helpers.js';

export default class ChatEvents extends EventEmitter {
    constructor() {
        super();
        this.init();
    }

    init() {
        var self = this;
        this.on("local", function (data) {
            if (!self.executeCommand(data)) {
                self.showInChat(data);
            }
        });

        this.on("tourist", function (data) {
            if (!self.executeCommand(data)) {
                if (data.sender && data.to && data.sender == data.to) return;
                if (!data.ts) data.ts = Date.now();                
                self.emit("Chat-Message", data);
                self.showInChat(data);
            }
        });
    }

    executeCommand(data) {
        if (data.msg.startsWith("/")) {
            var trigger = data.msg.replace("/", "");
            switch (trigger) {
                case "help":
                    data.msg = "Welcome to chat commands these are your options:<br>" +
                        "/help - this will trigger this information";
                    this.showInChat(data);
                    return true;
                default:
                    return false;
            }
        } else {
            return false;
        }
    }

    showInChat(data) {
        h.addChat(data, "local");
    }
}