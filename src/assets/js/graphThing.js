export default class Graph {
  constructor (gun, eventEmitter) {
    this.root = gun;
    this.eventEmitter = eventEmitter;
    this.init();
  }

  init () {
    this.eventEmitter.on('graph:update', async function () {
      // initialize web worker in upper scope
      var graphWorker = new Worker('/assets/workers/workerGraph.js');
      // handle result from graphworker
      graphWorker.onmessage = function (event) {
        if(DEBUG) {console.log('worker returned', event.data.svgString)}
        // parse result into an element
        var parser = new DOMParser();
        var el = parser.parseFromString(event.data.svgString, "image/svg+xml");
        var svg = el.children[0];
        // if we are 'renewing' empty the div
        var div = document.getElementById('graphDiv');
        if(div){
          div.innerHTML = "";
        } else {
          // otherwise create
          var div = document.createElement('div');
        }
        // add style to make it float on bottom right
        div.style.position = 'absolute';
        div.style.right = '0px';
        div.style.bottom = '0px';
        div.style.width = "300px";
        div.style.height = "300px";
        div.style.zIndex = '100000';
        div.style.borderRadius = '15%';
        div.style.backgroundColor = "rgba(200,200,200,0.2)"
        div.setAttribute('id','graphDiv')
        // append the svg to floating div
        div.appendChild(svg)
        // append floating div to body
        document.body.appendChild(div)

        // Joel? new widget?
      }

      /* Version 2 - traverse the room and all of its children
          enumerate into nodes and edges array as you go */

      if(DEBUG) { console.log('Worker Version 2')}
        // Breadth First Search
      var stack;
      var nodes;
      var edges;
      var start;
      var u;
      var label;
      var opt = true;

      if(DEBUG) { console.log('Worker Version 2: Starting traversal')}

      if(DEBUG) {console.log('Starting with: rtcmeeting')}

      label = 'label';
      start = 'rtcmeeting';
      stack = [];
      nodes = new Map();
      edges = new Map();
      start = await root.get(start).promOnce();
      nodes.set(start.key, {id:start.key, label:start.data.label, data:start.data});
      u = start;
      stack.push(u);
      do{
        while(!exhausted(u.data, edges)){
          // release control on each loop for ui
          await delay(20); //play with this value
          var edge = exhausted(u.data, edges, true);
          var v = await root.get(edge).promOnce();
          nodes.set(v.key, {id:v.key, label:v.data.label, data:v.data});
          edges.set(u.key+v.key, {source:u.key, target:v.key});
          stack.push(v);
        }
        while(!(stack.length==0)){
          await delay(20);
          var y = stack.shift();
          if(!exhausted(y.data,edges)){
            stack.push(y)
            u = y;
            break;
          }
        }
      }while(!(stack.length==0))

      graphWorker.postMessage({
        type:'pre-processed',
        nodes:transformMap(nodes),
        edges:transformMap(edges)});

      function exhausted(node,edges,opt) {
        var soul = Gun.node.soul(node);
        var arr = Object.keys(node);
        var i = 1;
        var l = arr.length;
        for(;i<l;i++){
          if(typeof(node[arr[i]]) == 'object' && node[arr[i]] != null){
            if(!edges.has(soul+node[arr[i]]['#'])){
              var temp = node[arr[i]]['#'];
              break;
            }
          }
        }
        if(!opt) {
          if(temp){
            return false;
          } else {
            return true;
          }
        } else {
          if(temp){
            return temp;
          }
        }
      };

      function transformMap (map) {
        var array = Array.from(map);
        var result = [];
        var i =0;
        var l = array.length;
        for(;i<l;i++){
          result.push(array[i][1])
        }
        return result;
      }
    });
  }
}
