'use strict';
const fs = require('fs');
var convertSpeechmaticsDpe = require('./index.js');

var exampleJSON = require('./speechmatics-short.sample.json');

const exampleOutput = convertSpeechmaticsDpe(exampleJSON);
console.log(JSON.stringify(exampleOutput, null, 2 ) );

fs.writeFileSync(__dirname + '/test.json', JSON.stringify(exampleOutput, null, 2 ) );