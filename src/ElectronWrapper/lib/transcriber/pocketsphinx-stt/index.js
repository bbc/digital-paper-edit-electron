/*
* @module transcribe
* @description SDK to use pocketsphinx
* @todo refactor with promisses.
* @example <caption> Example transcribing audio</caption>

pocketsphinx_transcribe(audioFile).then((result)=>{
	console.log(JSON.stringify(result,null,2));
}).catch((error)=>{
  console.log(error);
})

*
*/

'use strict';
//pockesphinx needs audio to be converted in a specific way fot it to be recognised by stt.
const audioToText = require('./pocketsphinx.js');
const convertPoketsphinxOutputToJson = require('./pocketsphinx-output-to-json/index.js');
/**
* @function transcribe
* @description transcribes
* @param {object} config - The parameter containting attribute options.
* @param {object} config.audio - file path to audio
* @param {callback} cb -
*/
function transcribe(audioFile) {
  console.log('pocketsphinx: getting started');
  
return new Promise((resolve, reject) => {
    audioToText(audioFile)
      .then((text) => {
        console.log('pocketsphinx: audio to text');
        const res = convertPoketsphinxOutputToJson(text);
        console.info('pocketsphinx: convert to json');
        resolve(res);
      }).catch((error) => {
        console.log(error);
        reject(error);
      });
  });
}

module.exports = transcribe;