const convertToAudio = require('./index.js');

const url = 'https://download.ted.com/talks/KateDarling_2018S-950k.mp4';
const audioFileOutput = './ted-talk.wav';

convertToAudio(url, audioFileOutput)
  .then((newFile) => {
    console.log(newFile);
  })
  .catch((err)=>{
    console.error(err)
  })
