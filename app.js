var appServer = require('./index');
appServer.start({ port: process.env.PORT || 3000, debug: true });