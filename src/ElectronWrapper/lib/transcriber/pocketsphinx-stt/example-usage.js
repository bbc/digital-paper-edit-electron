const pocketsphinx_transcribe = require('./index.js');

const audioFile = '/Users/passap02/seed-demo/audio/TEST.wav';

pocketsphinx_transcribe(audioFile).then((result) => {
  console.log(JSON.stringify(result, null, 2));
}).catch((error) => {
  console.log(error);
});