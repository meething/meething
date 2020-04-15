export default class PeerManagement {
  constructor() {
    const peers = ["https://livecodestream-us.herokuapp.com/gun"];
    const opt = { peers: peers, localStorage: false, radisk: false };
    const opt_out = { peers: [], localStorage: false, radisk: false };

    this.root = Gun(opt);
  }

  disconnectPeers() {
    console.log("Disconnect peers!");
  }
}

// function getPeers() {
//   var p = localStorage.getItem('gunPeers');
//   if (p && p !== 'undefined') {
//     p = JSON.parse(p);
//   } else {
//     p = {
//       'https://gun-us.herokuapp.com/gun': {},
//       'https://gun-eu.herokuapp.com/gun': {},
//       'https://gunjs.herokuapp.com/gun': {}
//     };
//   }
//   if (iris.util.isElectron) {
//     p['http://localhost:8767/gun'] = {};
//   }
//   Object.keys(p).forEach(k => _.defaults(p[k], {enabled: true}));
//   return p;
// }

// function resetPeers() {
//   localStorage.setItem('gunPeers', undefined);
//   peers = getPeers();
// }

// function savePeers() {
//   localStorage.setItem('gunPeers', JSON.stringify(peers));
// }

// function connectPeer(url) {
//   if (peers[url]) {
//     peers[url].enabled = true;
//     gun.opt({peers: [url]});
//     savePeers();
//   } else {
//     addPeer({url});
//   }
// }

// function disablePeer(url, peerFromGun) {
//   peers[url].enabled = false;
//   if (peerFromGun) {
//     disconnectPeer(peerFromGun);
//   }
//   savePeers();
// }

// function disconnectPeer(peerFromGun) {
//   gun.on('bye', peerFromGun);
//   peerFromGun.url = '';
// }

// async function addPeer(peer) {
//   if (!isUrl(peer.url)) {
//     throw new Error('Invalid url', peer.url);
//   }
//   peers[peer.url] = peers[peer.url] || _.omit(peer, 'url');
//   if (peer.visibility === 'public') {
//     // rolling some crypto operations to obfuscate actual url in case we want to remove it
//     var secret = await Gun.SEA.secret(key.epub, key);
//     var encryptedUrl = await Gun.SEA.encrypt(peer.url, secret);
//     var encryptedUrlHash = await Gun.SEA.work(encryptedUrl, null, null, {name: 'SHA-256'});
//     gun.user().get('peers').get(encryptedUrlHash).put({url: peer.url, lastSeen: new Date().toISOString()});
//   }
//   if (peer.enabled !== false) {
//     connectPeer(peer.url);
//   } else {
//     savePeers();
//   }
// }
