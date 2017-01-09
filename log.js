var colors = require('colors/safe');

var loglevel = 2;

module.exports.debug = function(message) {
    if (loglevel <= 0)
        console.log(colors.dim.italic(message));
};


module.exports.low = function(message) {
    if (loglevel <= 1)
        console.log(colors.grey(message));
};

module.exports.medium = function(message) {
    if (loglevel <= 2)
    console.log(colors.green(message));
    //console.log(message);
};

module.exports.high = function(message) {
    if (loglevel <= 3)
    console.log(colors.cyan(message));
    //console.log(message);
};

module.exports.error = function(message) {
    console.error(colors.red.bold(message));
}