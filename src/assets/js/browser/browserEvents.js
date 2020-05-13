import { meethingEvents } from '/assets/js/app.js';

window.addEventListener('DOMContentLoaded', function () {
    meethingEvents.browserEvent.handleStart();
});

window.addEventListener('beforeunload', function () {
    meethingEvents.browserEvent.handleLeave();
});