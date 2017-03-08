#!/usr/bin/env node
var argv = require('yargs')
    .usage('Load metadata from Socrata to update Google Sheet.\n\nUsage: $0 [options]')
    .count('verbose')
    .alias('v','verbose')
    .describe('v', 'Verbose. More v\'s, more verbose.')
    .help('h')
    .alias('h','help')
    .argv;

console.log(argv);

var updateSheet = require('./updateSheet');

updateSheet.updateFromSocrata(argv);
