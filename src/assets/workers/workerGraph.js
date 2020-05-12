//'use strict'
importScripts("https://d3js.org/d3.v5.min.js")

self.onmessage = async function (event) {

  // check obj against data
  // update data
  // using new data create svg
  if(event.data.type == 'pre-processed') {
    var nodes = event.data.nodes;
    var edges = event.data.edges;
    var width = event.data.size.width;
    var height = event.data.size.height;

  } else if (event.data.type == 'pcMap'){
    var user = event.data.user;
    var conn = event.data.conn;

    //process pcMap to show my side of the graph
    var nodes = [];
    var edges = [];

    nodes.push({id:nodes.length, user:user });
    for(let i = 0; i < conn.length; i++) {
      let currentPersonId = nodes.length;
      nodes.push({id:currentPersonId, user:conn[i]})
      edges.push({source:nodes[0].id, target:currentPersonId})
    }

  } else {
    self.postMessage({err: "Not correctly fed data"});
    self.close()
  }

  simulate(nodes, edges, width, height);

  /* Build the svg string */

  var svgString = buildString(nodes, edges, width, height);
  if(!svgString){
    self.postMessage({err: "No nodes"});
    self.close()
  }
  self.postMessage({svgString:svgString})
  self.close()
}

function delay (ms) {
  return new Promise((res, rej) =>{
    setTimeout(res, ms)
  })
}

function simulate (nodes, edges, width, height) {

  var simulation = d3.forceSimulation(nodes, (d)=>{return d.id})
    .force("charge", d3.forceCollide().radius(50))
    .force("r", d3.forceCenter(width/2, height/2))
    .force('link', d3.forceLink().links(edges).id(function(d){return d.id}))
    .stop()

  var n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()))
  for(var i=0;i<n;i++){
    simulation.tick();
  }
}

function buildString (n, e, w, h) {

  var color = d3.scaleOrdinal(n, d3.schemeCategory10)

  // start svg string with opening clause
  var string = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">';
  // define an arrow
  string += '<defs><marker id="endarrow" viewbox="0 0 8 6" ';
  string += ' markerWidth="15" markerHeight="12" ';
  string += ' refX="19" refY="6" orient="auto">';
  string += ' <path d="M 0 2 L 15 6 L 0 10" fill="rgb(10,11,24)"/> </marker>';
  string += '</defs>'

  if(e.length>0) {
    //iterate over each edge and create a line for it
    for(let edge of e) {
      // draw a line for each edge
      let substring = '<path '
      substring += 'stroke="'+color(edge.source.id)+'" ';
      substring += 'fill="none" stroke-opacity=".6" d="';
      substring += 'M '+edge.source.x+' '+edge.source.y +' ';
      substring += 'A 300 250 0 0 1 ' + edge.target.x + ' ' + edge.target.y + '"';
      substring += ' marker-end="url(#endarrow)"'
      substring += ' /> ';
      string += substring;
    }

  }

  // if there is nodes
  if(n.length>0){
    // iterate over all the nodes and add a circle with the coordinates
    // for each node
    for(let node of n) {
      node.x = Math.max(5, Math.min(w - 5, node.x));
      node.y = Math.max(5, Math.min(h - 5, node.y));
      let substring = '<circle '
      substring += 'stroke="'+color(node.id)+'" ';
      substring += 'fill="'+color(node.id)+'" ';
      substring += 'cx="'+node.x+'" ';
      substring += 'cy="'+node.y+'" ';
      substring += 'r="5" /> ';
      substring += '<text x="'+(node.x+5)+'" y="'+(node.y-10)+'" ';
      substring += 'fill="rgb(110,140,210)">'/*+color(node.id)+'">'*/;
      substring += node.label;
      substring += '</text>';
      string += substring;

    }

  } else {
    return undefined;
  }





  string += ' </svg>'
  return string
}
