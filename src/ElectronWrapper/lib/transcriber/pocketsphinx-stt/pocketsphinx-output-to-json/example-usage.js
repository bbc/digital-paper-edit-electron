const fs = require('fs');
const path = require('path');
const convertPocketsphinxOutputToJson = require('./index.js');

const pocketsphinxOutput = fs.readFileSync(path.join(__dirname, 'example-pocketsphinx-output.txt')).toString();

const res = convertPocketsphinxOutputToJson(pocketsphinxOutput);
console.log(JSON.stringify(res, null, 2));

fs.writeFileSync('./src/ElectronWrapper/lib/transcriber/pocketsphinx-stt/pocketsphinx-to-dpe/example-output.sample.json', JSON.stringify(res, null, 2) );