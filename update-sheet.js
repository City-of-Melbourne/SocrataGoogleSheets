#!/usr/bin/env node
var argv = require('yargs')
    .argv;

//console.log(argv);

var updateSheet = require('./updateSheet');

updateSheet.updateFromSocrata();
