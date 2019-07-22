const convertToVideo = require('./index.js');
// const videoFile = 'https://www.html5rocks.com/en/tutorials/video/basics/devstories.webm';
const videoFile = '/Users/passap02/Movies/The\ Paper\ Edit\ -\ video\ -\ youtube\ /The\ Paper\ Edit\ -\ Lesson\ 2\ of\ 4\ Building\ a\ Cut\ Sheet-USEJp5H3rsI.webm';
const videoHtml5OutputPathName = './paperEditTest.mp4';

convertToVideo({
  src: videoFile,
  outputFullPathName: videoHtml5OutputPathName
})
  .then((newFile) => {
    console.log(newFile);
  })
  .catch((err) => {
    console.error(err);
  });
