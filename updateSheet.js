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

/*
metadata": {
    "rdfSubject": "0",
    "custom_fields": {
      "Melbourne Metadata": {
        "Time period covered": "2009 - 2013"
      },
      "Data management": {
        "Custodian unit/team": "",
        "Update mechanism": "",
        "Data custodian email": "Yuriy Onyshchuk",
        "Source systems(s) (GIS, AssetMaster, etc)": ""
      },
      "Quality": {
        "Reliability level": "",
        "Source data update frequency": "Uploaded around the 10th of each month.",
        "What's included": "All data held by the City of Melbourne has been included"
      },
      "How to use": {
        "Further information": "",
        "Alerts": "",
        "Applicable standard (URL)": "",
        "Linked to": "http://www.pedestrian.melbourne.vic.gov.au/"
      }
    },

 */
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

                
                /*if (!props.metadata.custom_fields) {
                    props.metadata.custom_fields = {
                        'Melbourne Metadata': {},
                        'Data management': {},
                        'Quality': {},
                        'How to use': {}
                    };
                }
                var metadata = props.metadata.custom_fields['Melbourne Metadata'];

                // translate some of our lengthy field names into something shorter 
                metafields.metadataFields.forEach((mfield,i) => {
                    row[metafields.metadataFieldsOutput[i]] = metadata[mfield];
                });
                //console.log(row);*/
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

//(rows => console.log(rows[0]));




          /*// Add standard fields
            var row = fields.map(field => {
                var val = dataset[field];
                if (field === 'contactPoint') {
                    val = val.hasEmail ? val.hasEmail : '';
                }
                return val;
            });
            // add one special prop - data owner's screen name.
            //row.push(props.owner.screenName);
            if (!props.metadata.custom_fields) {
                props.metadata.custom_fields = {'Melbourne Metadata': {}};
            }
            // add custom fields
            var metadata = props.metadata.custom_fields['Melbourne Metadata'];
            metadataFields.forEach(field => row.push(metadata[field]));
            return row;*/
  


    /*
    return Promise.all(
        catalog.dataset
        //.filter((dataset, rownum) => rownum < 2000) // ??
        .map((dataset, rownum) => {
            var row = getDatasetValues(dataset);

            return rp({
                uri: dataset.identifier + '.json',
                json: true
            }).then(props => {
                //row.push(fdate(props.publicationDate));
                row.push(props.owner.screenName);
                if (!props.metadata.custom_fields) {
                    props.metadata.custom_fields = {'Melbourne Metadata': {}};
                }
                var metadata = props.metadata.custom_fields['Melbourne Metadata'];
                metadataFields.forEach(field => row.push(metadata[field]));
                return row;
            });
        })
    );
    */
/*
// uses the titles of each field
// turn array of arrays into array of objects: [ { field1: 1, field2: 'bleh' }, { field1: 0, field2: 'meh' } ... ]
getRows().then(rows => {
    var sorows = rows.map(row => {
        var sorow = {};
        fields.forEach((field, i) => sorow[field] = row[i]);
        metadataFieldsOutput.forEach((field, i) => sorow[field] = row[fields.length + i + 1]);
        return sorow;
    });
    // console.log(rows[0]);
    // console.log(JSON.stringify(sorows[0]));



    return require('./sheets').updateSheet(sorows);
    //console.log(fields.join(',') + ',Owner,Data quality,Original upload,Spatial dataset,Update frequency,Version number,Data completeness statement');
    //rows.forEach(row => console.log('"' + row.map(printify).join('","') + '"'));
});

*/