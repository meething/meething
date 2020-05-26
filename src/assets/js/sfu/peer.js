import EventEmitter from "../ee.js";

export class Peer extends EventEmitter {
    constructor(transport) {
        super();
        console.log('constructor()');

        // Closed flag.
        // @type {Boolean}
        this._closed = false;

        // Transport.
        // @type {protoo.Transport}
        this._transport = transport;

        // Connected flag.
        // @type {Boolean}
        this._connected = false;

        // Custom data object.
        // @type {Object}
        this._data = {};

        // Map of pending sent request objects indexed by request id.
        // @type {Map<Number, Object>}
        this._sents = new Map();
        this._handleTransport();
    }

    _handleTransport() {
        self = this;
        if (this._transport.closed) {
            this._closed = true;

            setTimeout(() => {
                if (this._closed)
                    return;

                this._connected = false;

                this.emit('close');
            });

            return;
        }

        this._transport.onopen = function (event) {
            if (this._closed)
                return;

            console.log('emit "open"');

            this._connected = true;
            self.emit('open');
        };

        this._transport.close = function (event) {
            if (this._closed)
                return;

            console.log('emit "close"');
            console.log('emit "disconnected"');

            this._connected = false;

            self.emit('disconnected');
        };

        this._transport.onerror = function (event) {
            if (this._closed)
                return;

            console.log('emit "failed" ');

            this._connected = false;

            self.emit('failed', event);
        };

        this._transport.onmessage = self._receiveMessage
    }

    _receiveMessage(message) {
        if (message != undefined) {
            message = JSON.parse(message.data);
            if (message.request)
                self._handleRequest(message);
            else if (message.response)
                self._handleResponse(message);
            else if (message.notification)
                self._handleNotification(message);
        }
    };

    _handleRequest(request) {

        if (request.method == "newConsumerOffer" || request.method == "newConsumer") {
            this.emit('request', request)
        } else {
            const response =
            {
                response: true,
                id: req.id,
                ok: true,
                data: { accept: true }
            };
            this.peer._transport.send(JSON.stringify(response));
        }
    }

    _handleResponse(response) {
        console.log("PEER::" + JSON.stringify(response));
        if (response.ok) {
            if (response.data.peers) {
                self.emit('peers', response.data);
            }
        }
    }

    _handleNotification(notification) {
        this.emit('notification', notification);
    }

    request(method, data = undefined) {
        // self = this;
        var oldOnMessage = self._transport.onmessage;
        return new Promise((res, rej) => {
            var capa = { "request": true, "id": 133437, "method": method, "data": data }
            this._transport.onmessage = function (message) {
                var response = JSON.parse(message.data)
                if (response.request) {
                    oldOnMessage(message);
                } else {
                    self._transport.onmessage = oldOnMessage
                    res(JSON.parse(message.data).data)
                }

            }
            this._transport.send(JSON.stringify(capa));
        });
    }
}