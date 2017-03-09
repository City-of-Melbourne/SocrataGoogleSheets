'use strict';
var Promise = require('bluebird');
var log = require('./log');
/* jshint esnext:true, node:true */
var rp = require('./requestPromiseJson');

var moment = require('moment');
var config = require('./config');
var metafields = require('./metafields');
var colors = require('colors');

var sheets = require('./sheets');
var sheet = sheets.getSheet();

function saveMetadata(id, metadata) {
    //return;
    if (options.dryrun) {
        log.low('(Not really)');
        return;
    }
    if (id !== 'fthi-zajy')
        //return;
    ;
    //console.log(`Updating ${id}: ${JSON.stringify(metadata)}`);
    //return;
    log.low(`${'Really updating'} ${id}: ${JSON.stringify(metadata)}`);
    //return console.log("NONONO");
    return rp.put({
        uri: 'https://data.melbourne.vic.gov.au/api/views/' + id + '.json',
        json: true,
        auth: {
            username: config.socrataAuth.email,
            password: config.socrataAuth.password,
        }, headers: {
            'X-App-Token': config.socrataAuth.appToken
        }, body: metadata
    }).then(response => {
        // no need to log?
        //console.log(JSON.stringify(response,null,2));
    });    
}

function getMetadata(rowid) {
    return rp.getJson('https://data.melbourne.vic.gov.au/api/views/' + rowid + '.json')
    .then(response => response);
}
/*
Usage: `updateFromColumn('Proposed title')`
where "Proposed title" is header (row 1) value of a column 
*/
var options;
module.exports.updateFromColumn = function(columnName, opts) {
    options = opts;

    log.setLevel(3 - options.verbose);
    if (!options) options = {};
    var socrataField = metafields.nameToField(columnName.replace(/Proposed /i, ''));
    sheets.getColumn(columnName)
    .then(vals => { 
        return Promise.map(vals, newval => { 
            //console.log(val);
            if (!newval.value || newval.value.trim() === '-' || newval.value.match(/^#/)) {
                //console.log(`Skipping blank value for ${newval.id}`);
                return;
            }
            return getMetadata(newval.id).then(metadata => {

                newval.value = newval.value.trim();
                var old;

                // This handles top level properties like "tags".              
                if (socrataField.fieldset === 'undefined') {
                    let socrataFieldName = metafields.dataFieldToViewField(socrataField.field);
                    if (socrataFieldName === 'tags') { // TODO need to do the same for any other array types
                        newval.value = newval.value.split(',');
                    }
                    old = metadata[socrataFieldName];
                    if (options.unchanged || JSON.stringify(old) !== JSON.stringify(newval.value)) {
                        //log.medium(`${newval.id}/${socrataFieldName}: ${old} -> ${newval.value}`);    
                        log.medium(`${newval.id.blue}/${socrataFieldName.yellow}: "${String(old).green}" -> "${String(newval.value).green}"`);    
                        let payload = {};
                        payload[socrataFieldName] = newval.value;

                        return saveMetadata(newval.id, payload);
                    } else {
                        log.low(`${newval.id.blue}/${socrataFieldName.yellow}: "${String(old).green}" Unchanged, skipping`);
                    }
                } else {
                    // updating a custom metadata field
                    // we have to fetch the full metadata, then replace the one value, otherwise we break everything.
                    old = metadata.metadata.custom_fields[socrataField.fieldset][socrataField.field];
                    if (options.unchanged || JSON.stringify(old) !== JSON.stringify(newval.value)) {
                        log.medium(`${newval.id.blue}/${socrataField.fieldset.yellow}.${socrataField.field.green}: "${old}" -> "${newval.value.green}"`);
                        metadata.metadata.custom_fields[socrataField.fieldset][socrataField.field] = newval.value;
                        // strip unwanted fieldsets.
                        delete(metadata.metadata.custom_fields['Melbourne Metadata']);
                        log.debug(JSON.stringify(metadata.metadata, null, 2));
                        return saveMetadata(newval.id, { metadata: metadata.metadata });
                    }
                }
            });
        }, { concurrency: 1 });
    }).tap(()=> log.high(`Finished updating ${columnName}`));
};

module.exports.updateFromColumns = function(columnNames, options) {
    columnNames.forEach(c => module.exports.updateFromColumn(c, options));
};
