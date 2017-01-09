module.exports.fields = ['title','theme','issued','modified','keyword', 'contactPoint', 'identifier','description','license', 'accessLevel','landingPage'];
module.exports.fieldIds = ['title','theme','issued','modified','keyword', 'contactpoint', 'identifier','description','license', 'accesslevel','landingpage'];
/* jshint esnext:true */
var log = require('./log');
var fieldNames = {
    'undefined': { // ok, it's a little bit weird. This is for "standard" fields, not on a fieldset.
        'title':'',
        'theme':'',
        'issued':'',
        'modified':'',
        'keyword':'',
        'contactPoint':'',
        'identifier':'',
        'description':'',
        'license':'',
        'accessLevel':'',
        'landingPage':'',

        'licenseId':'' // in the view page, not data.json
    },
    'Melbourne Metadata':{

        'Time period covered':'Time period covered', // deprecated
        'Geographic coverage – Jurisdiction' /* trailing space in original  */: 'Geographic coverage', // deprecated
        'fields':'' // ???
    }, 'Data management': {
        'Custodian unit/team':'Custodian unit or team',
        'Update mechanism':'Update mechanism',
        'Data custodian email':'Data custodian email',
        'Source systems(s) (GIS, AssetMaster, etc)':'Source system',
        'FME workspace name':''
    }, 'Quality': {
        'Reliability level':'Reliability level',
        'Source data update frequency':'Source data update frequency',
        'What\'s included':'Whats included',
        'Data quality statement': 'Data quality statement',
        'Reliability': 'Reliability' // not in use!

    }, 'How to use': {
        'Further information':'Further information',
        'Alerts':'Alerts',
        'Applicable standard (URL)':'Applicable standard URL',
        'Linked to':'Linked to'
    }
};

module.exports.idToName = function(fieldset, id) {
    //console.log(`[[${fieldset}, ${id}]]`);
    id = id.trim();
    var lookup = fieldNames[String(fieldset)];
    if (!lookup) {
        log.error('No fieldset ' + fieldset + ':' + id);
        return fieldset + '_' + id.replace(/'\(\);:/g,'');
    }
    if (lookup[id])
        return lookup[id];
    else
        return id;
};


var def = (x,y) => x ? x : y;

module.exports.nameToField = function(name) {
    var ret;
    Object.keys(fieldNames).forEach(fieldset =>
        Object.keys(fieldNames[fieldset]).forEach(field => {
            //console.log(fieldset, ':', def(fieldNames[fieldset][field], field).toLowerCase());
            if (def(fieldNames[fieldset][field], field).toLowerCase() === name.toLowerCase())
                ret = { fieldset: fieldset, field: field }
        })
    );
    if (ret) 
        return ret;
    else {
        log.error('No field found: ' + name);
        return { fieldset: 'undefined', field: name }; // probably a bit risky.
    }

};

// sigh. Socrata has different field names for the dataset-level view (https://data.melbourne.vic.gov.au/api/views/ygaw-6rzq) vs the data.json view.
// none of this is documented.
module.exports.dataFieldToViewField = function (field) {
    var r = {
        keyword: 'tags',
        title: 'name',
        contactPoint: '', // in order to set this, need to fetch privateMetadata and set contactEmail on it.
        identifier: '', // don't update this
        description: 'description',
        license: '', // hmm, probably it's licenseId we should be setting
        accessLevel: '', // don't update this
        landingPage: '', // don't update this
        licenseId: 'licenseId'
    }[field];

    if (!r) {
        throw(`You shouldn't be setting the field ${field}.`);
    }
    return r;
};    

// actual field names in Socrata JSON
module.exports.metadataFields =       ['Data Quality','Original upload date','Spatial dataset','Update Frequency','Version number','Data Completeness statement: Has the full dataset been included, or has a subset been excluded? Why?'];
// field names as we show them in Google Sheet
module.exports.metadataFieldsOutput = ['Data Quality','Original upload','Spatial dataset','Update Frequency','Version number','Data completeness statement'];

// field names as Google Sheets API expresses them
module.exports.metadataFieldIds =     ['dataquality','originalupload','spatialdataset','updatefrequency','versionnumber','datacompletenessstatement'];


module.exports.metadataIdToSocrata = function(id) {
    return module.exports.metadataFields[module.exports.metadataFieldIds.indexOf(id)];
};