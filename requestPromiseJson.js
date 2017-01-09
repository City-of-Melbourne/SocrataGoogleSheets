module.exports = require('request-promise');
/* jshint esnext:true */
module.exports.getJson = uri => module.exports.get({ uri: uri, json: true });
