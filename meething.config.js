module.exports = {
  apps : [{
    name: 'Meething',
    script: 'src/app.js',
    watch: './src',
    env : {
      SSL : true,
      SSLKEY : 'src/assets/privkey.pem',
      SSLCERT  : 'src/assets/fullchain.pm',
      DEBUG : false
  }]
};
