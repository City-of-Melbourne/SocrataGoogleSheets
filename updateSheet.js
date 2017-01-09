var rp = require('./requestPromiseJson');

var Promise = require('bluebird');
/* jshint esnext:true */

var moment = require('moment');
var secret = require('./secret.json');
var sheets = require('./sheets');
var log = require('./log');
var colors = require('colors');
function fdate(seconds) {
    return moment(seconds * 1000).format('YYYY-MM-DD');
}

function printify(val) {
    if (val === undefined)
        return '';
    return String(val).replace(/"/g, '""');
}

var metafields = require('./metafields');

function socrataField2SheetField(sofield) {


}

function getCatalog() {
    log.high('Fetching catalog metadata.');

    //return Promise.resolve(require('./data.json'));
    return rp.getJson('https://data.melbourne.vic.gov.au/data.json');
}

//var fields = Object.keys(catalog.dataset[0]).filter(field => ['distribution','publisher','@type'].indexOf(field) < 0);
var rows = [];

var found = {
  'Quality':{},
  'How to use':{},
  'Data management':{},
  
  'Melbourne Metadata':{}, // Gah, these two aren't even in use anymore.
  'Internal management': {}
  } 


function getRows(catalog) {
    log.high('Fetching metadata about each dataset');
    var LIMIT = 300;
    return Promise.map(catalog.dataset
        .filter((x, rownum) => rownum < LIMIT /*&& x.identifier === 'https://data.melbourne.vic.gov.au/api/views/k64i-2xff'*/), 
        dataset => {
            log.low(dataset.identifier + '.json');
            return rp.getJson(dataset.identifier + '.json')
            .then(props => {
                //console.log(props);
                var row = {};
                // standard fields
                metafields.fields.forEach(field => {
                    var val = dataset[field];
                    if (field === 'contactPoint') {
                        val = val.hasEmail ? val.hasEmail : '';
                    }
                    row[field] = val;
                });

                // custom metadata fields
                if (props.metadata.custom_fields) {
                    Object.keys(props.metadata.custom_fields).forEach(fieldset => 
                        Object.keys(props.metadata.custom_fields[fieldset]).forEach(field => {
                            row[metafields.idToName(fieldset, field)] = props.metadata.custom_fields[fieldset][field];
                            //log.low(fieldset,field);
                            found[fieldset][field] = true ;
                        }
                    ));
                }

                ['licenseId'].forEach(propField => {
                    row[propField] = props[propField];
                });

                
                return row;
            });
        }, { concurrency: 10 }
    );
}

function updateFromSocrata() {
    return getCatalog()
        .then(getRows)
        .tap(() => {
            // print out a header row, in case we need to reconstruct the sheet
            var header = '';
            Object.keys(found).forEach(fieldset => 
                Object.keys(found[fieldset]).forEach(field => 
                    header += metafields.idToName(fieldset, field) + '|'
                )
            );
            log.high(header.magenta);
            //console.log(Object.keys(rows[0]).join('|'));
            //console.log(JSON.stringify(found, undefined,2));
            log.high('Begin updating Google Sheet');
        })
        .then(sheets.updateSheet)
        .then(() => log.high('Done!'));
}
