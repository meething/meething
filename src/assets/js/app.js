/**
 * This module is the state machine and the event emitter to tie everything together
 * 
 * Usage
 * import { appEvents as app, meethingEvents } from '/assets/js/app.js';
 * 
 * Or when only need a specific import
 * import { meethingEvents } from '/assets/js/app.js';
 * 
 */
import EventEmitter from '/assets/js/utils/ee.js';

class App extends EventEmitter {
    constructor() {
        super();
    }
}

//The event emitter and subscriber
const appEvents = new App();

//The state of the application
const meethingStates = {
    defaultState: function () {
        console.log("Default State");
    },
    startState: function () {
        console.log("APP Start State");
        appEvents.emit("load_ui");
    }
}

//State machine for meething event and or browser events this will change the inner state that can emit stuff
const meethingEvents = {
    userEvent: {
        handleStart: function () {
            console.log("User entered")
        },
        handleLeave: function () {
            console.log("User Left")
        }
    },
    browserEvent: {
        handleStart: function () {
            console.log("Browser DomContentLoaded")
            meethingStates.startState();
        },
        handleLeave: function () {
            console.log("Browser before unload")
        }
    }
}

//Export the needed stuff
export { appEvents, meethingEvents };