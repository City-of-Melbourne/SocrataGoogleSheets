var Promise = require('bluebird');
var P = Promise.promisifyAll;
/* jshint esnext:true */
//var GoogleSheets = require('google-drive-sheets');
var GoogleSheets = require('google-spreadsheet');
var log = require('./log');
var colors = require('colors');
var sheet;
function getSheet(sheetnum) {
    if (sheet)
        return Promise.resolve(sheet);
    if (sheetnum === undefined)
        sheetnum = 1;// second sheet
    var creds = require('./API Project-9399330dfd2e.json');

    var sheets = P(new GoogleSheets('1M-imvcnNaXu4KngE8xuSeFiQTZey3YF2qYAIcxYmY18'));

    return sheets.useServiceAccountAuthAsync(creds)
        .then(() => sheets.getInfoAsync())
        .then(info => {
            log.medium('Using sheet: ' + info.worksheets[sheetnum].title);
            sheet = P(info.worksheets[sheetnum]);
            return sheet;
        }); 
}
module.exports.getSheet = getSheet;

var header = [];
function getHeaderRow() {
    return getSheet()
    .then(s =>  s.getCellsAsync({ 'max-row': 1, 'min-row': 1 }))
    .then(cells => {
        cells.forEach(cell => 
            header[cell.col] = cell.value);
        return header;
    });    
};

module.exports.getHeaderRow = getHeaderRow;

/* Update our second Google Sheet with an object of row data.
   Adds or updates existing rows as required.
 */
module.exports.updateSheet = function(socrataRows) {
    var sheet;
    //console.log(socrataRows);
    return getSheet().then(s => {
        sheet = s;
        return sheet.getRowsAsync({ 'start-index': -1 });
    }).then(rows => {
        return Promise.map(socrataRows, sorow => {

            // 'row.identifier' means the value of the cell in the column whose header is "identifier"
            row = rows.filter(row => row['identifier'] === sorow.identifier)[0];
            if (row) {
                log.low('Update Sheet: ' + row['identifier'].replace('https://data.melbourne.vic.gov.au/api/views/', '').blue);
                //console.log(Object.keys(row));
                //console.log(sorow);
                Object.keys(sorow).forEach(sokey => row[sokey] = sorow[sokey]);
                return P(row).saveAsync()
                    .tap(()=> log.debug('Done ' + sorow.identifier)); 
            } else {
                console.log('Add ' + sorow.identifier);
                //console.log(sorow);
                //return sheet.addRowAsync({identifier: 'fishburger', cranberry: 'crooboo','co lon':'tricky'});
                return sheet.addRowAsync(sorow)
                 //.then(()=>console.log('Done ' + sorow.identifier))
                 ;
            }
        }, {concurrency:10});
    }).catch(error => {
        log.error('Problem with Google Sheets' + JSON.stringify(error) + '\n\n');
    });
};

module.exports.getRows = function(sheetnum) {
    return getSheet(sheetnum).then(sheet => sheet.getRowsAsync({ 'start-index': -1 }));
};

// Given a field name, constructs an array of { id, value } objects by looking up the column.
module.exports.getColumn = function(fieldName) {
    const getCol = colNum => sheet
        .getCellsAsync({ 'min-row': 2, 'min-col': colNum, 'max-col': colNum})
        .then(cells => {
            var r = [];
            cells.forEach(cell => r[cell.row - 2] = cell.value);
            return r;
        });

    return getSheet()
        .then(getHeaderRow)
        .then(header => {
            var idColNum = header.indexOf('identifier');
            var fieldColNum = header.indexOf(fieldName);
            return Promise.all([getCol(idColNum), getCol(fieldColNum)])
                .then(results => 
                    results[0].map((id, i) => 
                        ({ 
                            id: id.replace('https://data.melbourne.vic.gov.au/api/views/', ''), 
                            value: results[1][i] 
                        } )));
        });
};