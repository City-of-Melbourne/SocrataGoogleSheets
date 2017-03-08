#!/usr/bin/env node
var argv = require('yargs')
    .usage('Reads values from a Google Sheet column, and updates Socrata datasets accordingly.\n\nUsage: $0 --column "Proposed title"')
    .demandOption(['column'])
    .describe('column','Name of column where new values are found. Must begin with "Proposed ".')
    .boolean('unchanged')
    .describe('unchanged','Update even if value hasn\'t changed.')
    .boolean('dryrun')
    .describe('dryrun','Don\'t actually carry out the changes.')
    .count('verbose')
    .alias('v','verbose')
    .describe('v', 'Verbose. -vv=More verbose. -vvv=Very verbose.')
    .help('h')
    .alias('h','help')
    .argv;

console.log(argv);

var updateSocrata = require('./updateSocrata');

if (Array.isArray(argv.column)) {
    updateSocrata.updateFromColumns(argv.column, argv);
} else {
    updateSocrata.updateFromColumn(argv.column, argv);
}
