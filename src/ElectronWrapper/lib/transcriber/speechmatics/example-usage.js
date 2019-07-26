// console.log('SPEECHMATICS config.sttEngine: ', JSON.stringify(newFile, null, 2));

// var SendToSpeechmaticsUtil = new SendToSpeechmatics();
// SendToSpeechmaticsUtil.send(newFile, config.keys.speechmatics, config.languageModel, function(error, data) {
//   if (error) {
//     callback(error, null);
//   } else {
//     console.log('SPEECHMATICS-DATA', JSON.stringify(data));
//     console.log('SPEECHMATICS-JSON', JSON.stringify(convertSpeechmaticsJsonToTranscripJson(data), null, 2));
//     callback(null, convertSpeechmaticsJsonToTranscripJson(data));
//   }
// });

const speechmaticsSTT = require('./index.js');

const newFile = '/Users/passap02/Documents/sample-media/short/kate-short.mp4';

speechmaticsSTT(newFile)
  .then((res) => {
    console.log('example-usage', res);
  }).catch((err) => {
    console.error('err', err);
  });