var fs = require('fs');
let express = require('express');
let app = express();
let https = require('https');

let stream = require('./ws/stream');
let path = require('path');

var options = {
  key: fs.readFileSync('src/assets/server.key'),
  cert: fs.readFileSync('src/assets/server.cert')
}

var port =  process.env.PORT || process.argv[2] || 8443;

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});


//server.listen(port);
var server = https.createServer(options, app);
server.listen(port);


//var gun = Gun({web: server.listen(port)});
//console.log('Relay peer started on port ' + config.port + ' with /gun');
