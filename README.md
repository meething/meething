<img src="https://i.imgur.com/XS79fTC.png" width=300>

# webRTC Gun Meeting
A semi-decentralized conference bridge using WebRTC, [GunDB](http://gun.eco) and Node

<img src="https://user-images.githubusercontent.com/1423657/78457103-3260a800-76a8-11ea-8c7a-c909c88ba716.png" width=600>

## Status
* Experimental!

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

#### Isolation Test @qxip @amark @qvdev
<img src="https://user-images.githubusercontent.com/1423657/77968595-04661700-72e8-11ea-8226-b90fbe8011c8.png" width=500 />
<img src="https://user-images.githubusercontent.com/1423657/77922600-8b43d100-72a1-11ea-9879-8e7751fde140.png" width=500 />

#### 0.1 w/ @yeetmydog
<img src="https://user-images.githubusercontent.com/1423657/77825853-43d80c00-710c-11ea-917c-83c2ddd08959.png" width=500/>

-------------

## Blocking Bugs
* [ ] in 3+ party mode, new participants are not aware of existing subscribers

## Todo
* [x] create a basic working prototype
* [x] implement ts gate to discard old events
* [ ] cleanup abandoned gun sessions
* [ ] implement letsencrypt ssl automode
* [ ] implement CSS Styling, User Display, etc
* [ ] fix a bunch of early stage bugs!

## Credits
This is a modified fork of [Video-Call-App-NodeJS](https://github.com/amirsanni/Video-Call-App-NodeJS) of by Amir Sanni
