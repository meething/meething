export default class Graph {
  constructor() {
    this.nodes = [];
    this.edges = [];

    // initiate webworker here
    this.worker = new Worker('workerGraph.js');
  }

  // create listeners for results
  updateGraph () {
    console.log('sending update to webworker')
    this.worker.postMessage({
      nodes: this.nodes,
      links: this.edges
    });
  }


  this.worker.onmessage = function(event) {
    switch (event.data.type) {
      case "tick": return ticked(event.data);
      case "end": return ended(event.data);
    }
  }

  add(msg) {

    // TODO: handle different events, add should only execute if event is presence or enter

    // build graph nodes and edges from metadata

    // turn data into an array, this array contains 'edges'
    let data = JSON.parse(msg.data);
    data = data[0];
    //find each PID and see if it already there
    let indexPid = this.nodes.findIndex(msg.pid);
    // if not found
    if(indexPid<0) {
      this.nodes.push(msg.pid); //if it's me and I am not here push me in
      for(let peer of data) {
        console.log(peer)
        //if this isn't the the client building the graph
        if(peer[0] !== msg.pid) {
          // build an edge
          let edge = {};
          edge.source = msg.pid;
          edge.target = peer[0];
          this.edges.push(edge);
        }
      }
    }
    updateGraph();
  }

  remove(msg) {
    //TODO: remove should only execute if event is 'leave'

    // remove graph nodes and edges from metadata
    let indexPid = this.nodes.findIndex(msg.pid);
    // actually in nodes
    if(indexPid >= 0) {
      // remove from nodes
      this.nodes.splice(indexPid, 1);
    }
    //iterate over edges objects and remove any edges that are either from or to this pid
    this.edges.forEach((edge, index, edges) => {
      if(edge.source == msg.pid || edge.target == msg.pid) {
        this.edges.splice(index, 1);
      }
    })
    updateGraph()
  }

}
