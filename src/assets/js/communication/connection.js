import { appEvents as app } from '/assets/js/app.js';
import SFU from "./sfu/sfu.js";

app.on('join', join);

const MODE = "SFU"

function join() {
    switch (MODE) {
        case "SFU":
            console.log("Join via SFU");
            const sfu = new SFU(app);
            sfu.join();
            break;
        default:
            console.log("Implement P2P")
            break;
    }
}
