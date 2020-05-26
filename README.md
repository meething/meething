<img src="https://i.imgur.com/XS79fTC.png" width=200> <img width="100" alt="mozilla-builders" src="https://user-images.githubusercontent.com/1423657/81992335-85346480-9643-11ea-8754-8275e98e06bc.png">


# Meething : dWebRTC

Meething is a semi-decentralized conference bridge using modern WebRTC, [GunDB](http://gun.eco) and [MediaSoup](https://mediasoup.org/) to produce a hybrid MESH-SFU with strong privacy, zero user data retention and powerful off-grid capabilities.

<img src="https://user-images.githubusercontent.com/1423657/78457103-3260a800-76a8-11ea-8c7a-c909c88ba716.png" width=500>

## Status
* Working Status, _still dWeb-x-perimental!_
* Project Selected by [Mozilla Spring Builders MVP Lab](https://builders.mozilla.community/springlab/index.html) :heart:
* Contributors and Testers welcome! Join or open an [issue](https://github.com/meething/webrtc-gun/issues) for more!

<a href="https://us.meething.space" target="_blank">
<img src="https://user-images.githubusercontent.com/1423657/82707584-a537d980-9c7c-11ea-8253-08f063ac8644.gif" width=600>


Ready to try Meething? Join Now!</a>

<br/>

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/https://github.com/meething/webrtc-gun/gun-meething)

### Installation
#### Docker
Try Meething using [docker](https://github.com/meething/meething-docker) containers
#### Manual
* Clone the repository and install using `npm`
```
npm install
```
#### Configuration
* Copy the example `meething.config.js` to `custom.config.js`
* Configure your SSL certificates
* Run using pm2
```
pm2 start custom.config.js
```

### Usage
* Browse to the configured HTTPS port _(default 8443)_
* Accept the self-signed certificates _(if needed)_
* Choose a Room and User name
* Share link with other participants

The Meething  application will connect to community Gun nodes for user discovery. All room data/audio/video is p2p.


#### SuperPeers
SuperPeers can provide the network with services such as STUN/TURN/RELAY and in the future SFU/MCU features. For more details, check out the Project Wiki.

<!--

--------------

## Screenshots


#### Isolation Test @qxip @amark @qvdev
<img src="https://user-images.githubusercontent.com/1423657/77968595-04661700-72e8-11ea-8226-b90fbe8011c8.png" width=500 />
<img src="https://user-images.githubusercontent.com/1423657/77922600-8b43d100-72a1-11ea-9879-8e7751fde140.png" width=500 />

#### 0.1 w/ @yeetmydog
<img src="https://user-images.githubusercontent.com/1423657/77825853-43d80c00-710c-11ea-917c-83c2ddd08959.png" width=500/>

-->

-------------



#### Credits & Thanks
* [Meething Team](https://github.com/meething/meething/graphs/contributors) on Discord for making this happen!
* [Mozilla Builders](https://builders.mozilla.community/) for supporting our idea!
* [Mediasoup](mediasoup.org) Team for their kickass SFU!
* [Mark's GUN](https://gun.eco/) and its community!

