module.exports = {
  apps : [{
    name: 'Meething",
    script: 'src/app.js',
    watch: './src'
  }],

  deploy : {
    production : {
      SSL : true,
      SSLKEY : 'src/assets/privkey.pem',
      SSLCERT  : 'src/assets/fullchain.pm',
      DEBUG : false,
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload meething.config.js --env production',
      'pre-setup': ''
    },
    development : {
      SSL : false,
      DEBUG : true,
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload meething.config.js --env development',
      'pre-setup': ''
    }
  }
};
