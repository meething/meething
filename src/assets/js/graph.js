export default Graph (webworker) {

  let nodes = [];
  let edges = [];

  // assume webworker is initiated
  // create listeners for results
  function workWeb () {
    worker.postMessage({
      nodes: nodes,
      links: edges
    });
  }


  worker.onmessage = function(event) {
    switch (event.data.type) {
      case "tick": return ticked(event.data);
      case "end": return ended(event.data);
    }
  };

  function findPid (pid) {
    //iterate over nodes to find pid , return index of nodes array
  }


  function add (msg) {

    /* Example of message
    {
     "pid":"VPlanzWWs", //pid of event, well
     "event":"presence",
     "data":"[ // data in json
       ["VPlanzWWs",null],
       ["3CkR1nfjW",{"pid":"3CkR1nfjW","event":"enter","data":null,"#":"aatAqvIZm"}] //pid of arriving
     ]",
     "#":"5ISuD9Sls"
   }
   */

    // build graph nodes and edges from metadata

    // turn data into an array, this array contains 'edges'
    let data = JSON.parse(msg.data);
    data = data[0];
    //find each PID and see if it already there
    let indexPid = findPid(msg.pid);
    // if not found
    if(!indexPid) {
      // add myself and check if there is any edges needed
      nodes.push(msg.pid);
      for(let index in data) {
        console.log(data[index])
        if(data[index][0] !== msg.pid) {
          // build an edge
          let edge = {};
          edge.source = msg.pid;
          edge.target = data[index][0];
          edges.push(edge);
        }
      }
    }

  }

  function remove(msg) {
    // remove graph nodes and edges from metadata
    let indexPid = findPid(msg.pid);
  }

}
