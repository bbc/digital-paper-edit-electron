const convertPocketsphinxOutputToDpe = require('./index.js');
const jsonData = require('./example-output.sample.json');

const res = convertPocketsphinxOutputToDpe(jsonData);
console.log(res);