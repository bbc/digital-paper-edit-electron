const { readMetadataForEDL, readMetadata } = require('./index.js');
//TODO: how to test this module without testing the ffprobe binary? What is a good way to deal with the media dependency to run the test? eg you need an audio or video file to run the test.
// var sampleVideo = '/Users/passap02/Documents/sample-media/PBS_Frontline/The\ Putin\ Files\ -\ Julia\ Ioffe-b1HWNcLDK88.mp4';
const sampleVideo = '/Users/passap02/Dropbox\ \(BBC\)/BBC\ News\ Labs/Projects/digital\ paper\ edit/demo-material/PBS\ Frontline\ -\ The\ Facebook\ Dilemma\ -\ interviews/video/The Facebook Dilemma - Naomi Gleit-l-Ivr6kq6fk.mp4';
// const sampleVideo = '/Users/passap02/Desktop/ADL-fb-short-test/Elizabeth_Linder-3-min57sec.wav';

const ffprobePath = require('ffprobe-static-electron').path;

readMetadataForEDL({
  file: sampleVideo,
  ffprobePath: ffprobePath
}).then((res) => {
  console.log(res);
});

// readMetadata({
//   file: sampleVideo,
//   ffprobePath: ffprobePath,
// }).then((res) => {
//   console.log(res);
// });

// Guy Rosen
// metadataData: '2018-11-16 19:37:41',
// reelName: 'NA',
// timecode: 'NA',
// fps: 23.98,
// duration: 1532.197333,
// sampleRate: 44100

// fileName: 'The Facebook Dilemma - Naomi Gleit-l-Ivr6kq6fk.mp4',
// date: '2018-11-16 18:11:27',
// reelName: 'NA',
// timecode: 'NA',
// fps: 23.98,
// duration: 1643.224917,
// sampleRate: 44100