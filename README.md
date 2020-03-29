<img src="https://i.imgur.com/XS79fTC.png" width=300>

# webRTC Gun Meeting
A semi-decentralized conference bridge using WebRTC, [GunDB](http://gun.eco) and Node

<img src="https://i.imgur.com/UBrZLRv.gif" width=300/> <img src="https://user-images.githubusercontent.com/1423657/77825853-43d80c00-710c-11ea-917c-83c2ddd08959.png" width=300/>

## Installation
```
npm install
npm start
```

## Usage
* Browse to the configured HTTPS port _(default 8443)_
* Accept the self-signed certificates if needed
* Choose a Room and User name
* Share link with other participants

## Todo
* [x] create a basic working prototype
* [x] implement ts gate to discard old events
* [ ] cleanup abandoned gun sessions
* [ ] implement letsencrypt ssl automode
* [ ] implement CSS Styling, User Display, etc
* [ ] fix a bunch of early stage bugs!

## Credits
This is a modified fork of [Video-Call-App-NodeJS](https://github.com/amirsanni/Video-Call-App-NodeJS) of by Amir Sanni <amirsanni@gmail.com>
