#!/usr/bin/env node
var argv = require('yargs')
    .usage('Usage: $0 --column "Proposed title"')
    .demandOption(['column'])
    .boolean('unchanged')
    .describe('unchanged','Update even if value hasn\'t changed.')
    .argv;

console.log(argv);

var updateSocrata = require('./updateSocrata');

if (Array.isArray(argv.column)) {
    updateSocrata.updateFromColumns(argv.column, argv);
} else {
    updateSocrata.updateFromColumn(argv.column, argv);
}
