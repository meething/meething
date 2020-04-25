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
   key: process.env.SSLKEY ? fs.readFileSync(process.env.SSLKEY) : fs.readFileSync('src/assets/server.key'),
   cert: process.env.SSLCERT ? fs.readFileSync(process.env.SSLCERT) : fs.readFileSync('src/assets/server.cert')
}

config.port = process.env.PORT || 443;
config.gunport = process.env.GUNPORT || 8765;

var staticOptions = {
  setHeaders: function (res, path, stat) {
    var inUrl = res.req.url,
    clean = (inUrl.indexOf("?") > 0) ? inUrl.substring(0, inUrl.indexOf("?")) : inUrl,
    last = clean.lastIndexOf('.'),
    ext = clean.substring(last + 1);
    if(ext == "js"){
    res.set('Content-Type', 'application/javascript')
    }
  }
}

app.use('/assets', express.static(path.join(__dirname, 'assets'), staticOptions));

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
