module.exports = {
  apps : [{
    name: 'Meething',
    script: 'src/app.js',
    watch: './src',
    env : {
      SSL : true,
      SSLKEY : 'src/assets/privkey.pem',
      SSLCERT  : 'src/assets/fullchain.pm',
      SFU_URL : false,
      DEBUG : false
  }]
};
