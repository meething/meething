var med = null;
var self = null;

export default class GunControl {
  constructor (mediator) {
    this.mediator = mediator;
    med = this.mediator;
    self = this;

    return this;
  }

  createInstance () {
    var opt = { radisk: false, localStorage:false };
    var gun = Gun(opt);
    med.root = gun;
    return gun;
  }

  clearPeers () {
    if(!med.root) {
      return self.createInstance();
    }

    const keys = Object.keys(med.root._.opt.peers)
    for (const key of keys) {
      var peer = med.root._.opt.peers[key];
      peer.enabled = false;
      med.root.on('bye', peer);
      peer.url = '';
    }
    return med.root;
  }

  addPeer (peerUrl) {
    let peers = med.root._.opt.peers; //if we have other peers here it will add them
    let peer = {};
    peer.id = peerUrl;
    peer.url = peerUrl;
    peer.enabled = true;
    peers[peerUrl] = peer;
    med.root._.opt.peers = peers;
    med.root.on('hi', med.root._.opt.peers[peer.id]);
  }

  removePeer (peerUrl) {
    const keys = Object.keys(med.root._.opt.peers)
    for (const key of keys) {
      if(key == peerUrl) {
        var peer = med.root._.opt.peers[key];
        peer.enabled = false;
        med.root.on('bye', peer);
        peer.url = '';
        return true;
      }
    }
    return false;
  }
}
