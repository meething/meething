var fs = require('fs');
let express = require('express');
let app = express();
let https = require('https');
let http = require('http');
var Gun = require('../../gun');

let stream = require('./ws/stream');
let path = require('path');

var config = {};

config.options = {
  key: process.env.SSLKEY || fs.readFileSync('/home/coder/ssl/rig/privkey.pem'),
  cert: process.env.SSLCERT || fs.readFileSync('/home/coder/ssl/rig/fullchain.pem')
}

config.port =  process.env.PORT || 8443;
config.gunport =  process.env.GUNPORT || 8766;

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});
app.get('/:room/gun', (req, res)=>{
    console.log('Gun request for roomid',req.params.room)
  /* serve unique Gun instance */
  //var gun = Gun({peers: [], web: server.listen(port)});
  //console.log('Relay peer started on port ' + config.port + ' with /gun');
});


app.listen(config.port, () => console.log(`Example app listening on port ${config.port}!`))

//server.listen(port);
// if (process.env.NOSSL) {
// 	config.server = http.createServer({}, app);
// 	config.server.listen(config.port);

// } else {
// 	config.server = https.createServer(config.options, app);
// 	config.server.listen(config.port);
// }

config.webserver = require('http').createServer();
var gun = Gun({web: config.webserver.listen(config.gunport)});

//var gun = Gun({web: server.listen(port)});
//console.log('Relay peer started on port ' + config.port + ' with /gun');
