var fs = require('fs');
let express = require('express');
let app = express();
let https = require('https');
let http = require('http');
var Gun = require('gun');

let stream = require('./ws/stream');
let path = require('path');

var config = {};

config.options = {
  key: process.env.SSLKEY || fs.readFileSync('/etc/letsencrypt/live/meething.hepic.tel/privkey.pem'),
	cert: process.env.SSLCERT || fs.readFileSync('/etc/letsencrypt/live/meething.hepic.tel/fullchain.pem')
}

config.port = process.env.PORT || 443;
config.gunport = process.env.GUNPORT || 8765;

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

if (!process.env.SSL) {
	config.webserver = http.createServer({}, app);
	config.webserver.listen(config.port, () => console.log(`Example HTTP app listening on port ${config.port}!`))
} else {
	config.webserver = https.createServer(config.options, app);
	config.webserver.listen(config.port, () => console.log(`Example HTTPS app listening on port ${config.port}!`))
}

//var gun = Gun({web: server.listen(port)});
//console.log('Relay peer started on port ' + config.port + ' with /gun');
