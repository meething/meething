var self;
var med;

export default class Graph {
  constructor (mediator) {
    this.mediator = mediator;
    med = this.mediator;
    self = this;

    return this;
  }

  init () {
    console.log('fix the Graph');

    med.ee.on("graph:toggle", self.snatch)

    med.ee.on("sfu:peer", function(ev) {
      console.log("peer added", ev);
      if(med.graphedVideo) med.ee.emit("graph:toggle", "no data");
    });

    med.ee.on('speaking', function(data) {
      console.log('speaking', data);
      if(med.graphedVideo) {
        var videoArray = document.querySelectorAll('video');

        videoArray.forEach((item, i) => {
          //if this video is the one speaking
          if(item.id == data.socketId + '-video') {
            // check if it's not already speaking
            if(item.classList.contains('speaking')){
              // already speaking
               return;
             } else {
               // turn speaking on (makes it bigger and orange)
               item.classList.add('speaking');
             }
          } else {
            item.classList.remove('speaking');
          }
        });
        self.snatch();
      }
    });
  }

  async snatch (data) {
    med.graphedVideo = true;
    self.graphWorker = new Worker('/assets/workers/workerGraph.js');
    // create Graph Div to make the graph area??
    if(!document.querySelector('#graphDiv')) {
      var div = document.createElement('div');
      div.setAttribute('style', 'width:100%;height:100%;z-index:1000;')
      div.setAttribute('id', 'graphDiv');
      document.body.appendChild(div);
    } else {
      var div = document.querySelector('#graphDiv');
    }
    // gather video elements (aka visible peers)
    try {
      var videoArray = document.querySelectorAll('video');
      var obj = {nodes:[], edges:[]};
      // attach them to a graph and add bubble style
      videoArray.forEach((item, i, arr) => {
        var speaking = false;
        var r = 80;
        if(item.classList.contains('speaking')){r = 180; speaking = true;};
        console.log('r is', r);
        obj.nodes.push({id:i, r:r});
        for(let y=0;y<arr.length;y++){
          if(i != y) {
            obj.edges.push({source:i, target:y})
          }
        }
        div.appendChild(item);
        if(speaking) {
          item.setAttribute('class', 'graphVideo speaking')
        } else {
          item.setAttribute('class', 'graphVideo')
        }

      });

    } catch (e) {
      console.warn('no video found');
      return;
    }

    //handle data when it comes back
    self.graphWorker.onmessage = function(ev) {
      var nodes = ev.data.nodes;
      for(let i=0; i<nodes.length; i++) {
        let string = `left: ${nodes[i].x - (nodes[i].r/2)}px;top: ${nodes[i].y - (nodes[i].r/2)}px;`;
        videoArray[i].setAttribute('style', string);
      }
    }
    // send data to worker and await return
    self.graphWorker.postMessage({
      type:'pre-processed',
      nodes:obj.nodes,
      edges:obj.edges,
      size: {width:window.innerWidth, height:window.innerHeight}
    });

  }

  start () {
    self.ee.on('graph:update', async function () {
      // initialize web worker in upper scope
      var graphWorker = new Worker('/assets/workers/workerGraph.js');
      // handle result from graphworker
      graphWorker.onmessage = function (event) {
        if(self.mediator.DEBUG) {console.log('worker returned', event.data.svgString)}
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
        div.style.visibility = 'hidden';
        div.style.right = '0px';
        div.style.bottom = '0px';
        div.style.pointerEvents = 'none';
        div.style.width = window.innerWidth;
        div.style.height = window.innerHeight;
        div.style.zIndex = '100000';
        div.style.backgroundColor = "rgba(100,100,100,0.1)"
        div.setAttribute('id','graphDiv')
        // append the svg to floating div
        div.appendChild(svg)
        // append floating div to body
        document.body.appendChild(div)

        // Joel? new widget?
      }

      /* Version 2 - traverse the room and all of its children
          enumerate into nodes and edges array as you go */

      if(med.DEBUG) { console.log('Worker Version 2')}
        // Breadth First Search
      var stack;
      var nodes;
      var edges;
      var start;
      var u;
      var label;
      var opt = true;

      if(med.DEBUG) { console.log('Worker Version 2: Starting traversal')}

      if(med.DEBUG) { console.log('Starting with: meething')}

      label = 'label';
      start = 'meething';
      stack = [];
      nodes = new Map();
      edges = new Map();
      start = await med.root.get(start).promOnce();
      nodes.set(start.key, {id:start.key, label:start.data.label, data:start.data});
      u = start;
      stack.push(u);
      do{
        while(!exhausted(u.data, edges)){
          // release control on each loop for ui
          await delay(20); //play with this value
          var edge = exhausted(u.data, edges, true);
          var v = await root.get(edge).promOnce();
          nodes.set(v.key, {id:v.key, label:v.data.label || v.key , data:v.data});
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
        edges:transformMap(edges),
        size: {width:window.innerWidth, height:window.innerHeight}
      });

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

      function delay(ms) {
        return new Promise((res, rej)=>{
          setTimeout(res, ms);
        })
      }
    });
    self.ee.on('graph:toggle', function () {
      var graphDiv = document.getElementById('graphDiv');
      if(graphDiv) {
        if(graphDiv.style.visibility == 'hidden') {
          graphDiv.style.visibility = 'visible';
        } else if(graphDiv.style.visibility == 'visible'){
          graphDiv.style.visibility = 'hidden';
        } else {
          console.error('Graph not available at this time', graphDiv);
        }
      } else {
        console.error('Graph not available at this time', graphDiv);
      }
    });
  }
}
