'use strict'
importScripts("https://d3js.org/d3.v5.min.js")

self.onmessage = async function (event) {

  // check obj against data
  // update data
  // using new data create svg
  var nodes = event.data.nodes;
  var edges = event.data.edges;
  simulate(nodes, edges);

  console.log(nodes)
  console.log (edges)

  /* Build the svg string */

  var svgString = buildString(nodes, edges);
  if(!svgString){
    self.postMessage({err: "No nodes"});
    self.close()
  }
  self.postMessage({svgString:svgString})
  self.close()
}

async function delay (ms) {
  return new Promise((res, rej) =>{
    setTimeout(res, ms)
  })
}

function simulate (nodes, edges) {

  var simulation = d3.forceSimulation(nodes, (d)=>{return d.id})
    .force("charge", d3.forceCollide().radius(50))
    .force("r", d3.forceRadial(400, 400, 450))
    .force('link', d3.forceLink().links(edges).id(function(d){return d.id}))
    .stop()



  var n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()))
  for(var i=0;i<n;i++){
    simulation.tick();
  }
}

function buildString (n, e) {

  var color = d3.scaleOrdinal(n, d3.schemeCategory10)

  // start svg string with opening clause
  var string = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900">';
  // define an arrow
  string += '<defs><marker id="endarrow" viewbox="0 0 8 6" ';
  string += ' markerWidth="6" markerHeight="4" ';
  string += ' refX="6" refY="2" orient="auto">';
  string += ' <path d="M 0 1 L 6 2 L 0 4" fill="rgb(200,200,200)"/> </marker>';
  string += '</defs>'

  // if there is nodes
  if(n.length>0){
    // iterate over all the nodes and add a circle with the coordinates
    // for each node
    for(let node of n) {
      let substring = '<circle '
      substring += 'stroke="'+color(node.id)+'" ';
      substring += 'fill="'+color(node.id)+'" ';
      substring += 'cx="'+node.x+'" ';
      substring += 'cy="'+node.y+'" ';
      substring += 'r="2" /> ';
      substring += '<text x="'+(node.x+5)+'" y="'+(node.y-10)+'" ';
      substring += 'fill="rgb(250,250,250)">'/*+color(node.id)+'">'*/;
      substring += node.id;
      substring += '</text>';
      string += substring;

    }



  } else {
    return undefinded;
  }

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



  string += ' </svg>'
  return string
}
