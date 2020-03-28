var fs = require('fs');
let express = require('express');
let app = express();
let https = require('https');
var Gun = require('gun');

let stream = require('./ws/stream');
let path = require('path');

var config = {};

config.options = {
  key: fs.readFileSync('src/assets/server.key'),
  cert: fs.readFileSync('src/assets/server.cert')
}

config.port =  process.env.PORT || 8443;
config.gunport =  process.env.GUNPORT || 8765;

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});


//server.listen(port);
config.server = https.createServer(config.options, app);
config.server.listen(config.port);

config.webserver = require('http').createServer();
var gun = Gun({web: config.webserver.listen(config.gunport)});

//var gun = Gun({web: server.listen(port)});
//console.log('Relay peer started on port ' + config.port + ' with /gun');
