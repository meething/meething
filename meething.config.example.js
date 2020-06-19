module.exports = {
  apps : [{
    name: 'Meething',
    script: 'src/app.js',
    watch: './src',
    env : {
      PORT: 3443,
      SSL : true,
      SSLKEY : 'certs/privkey.pem',
      SSLCERT  : 'certs/fullchain.pem',
      SFU_URL : false,
      DEBUG : false
  }
}]
}