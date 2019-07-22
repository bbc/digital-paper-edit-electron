// originally from https://github.com/OpenNewsLabs/autoEdit_2/blob/master/lib/interactive_transcription_generator/video_to_html5/index.js
/**
 * @module convertToVideo
 * @description Converts audio or video file into a HTML5 video mp4.
 *  previous version was using webm as explained here:
 * uses code from [this issue/question from fluent-ffmepg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/274)
 * to understand the ffmpeg used to encode webm video see [this guide](https://trac.ffmpeg.org/wiki/Encode/VP8)
 *
 * now uses: mp4
 * @example <caption>Example usage</caption>

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

* @example <caption>Example of object retunred video webm html5 </caption>
  {
    videoOgg: "path/to/video/webmFile.webm",
    processedVideo: true
  }
 * @requires fluent-ffmpeg
 * @requires an ffmpeg binary. For example if packaged inside a nwjs app. This can be set in config attributes options.
 */
'use strict';

const ffmpegBin = require('ffmpeg-static-electron');
const ffmpegBinPath = ffmpegBin.path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegBinPath);

/**
 * @function convert
 * @description Takes in a config object with propreties: src, outputFullPathName, ffmpegBin and optional callback.
 * @param {object} config - The parameter containting attribute options.
 * @param {string} config.src - full path of video or audio to convert.
 * @param {string} config.outputFullPathName - full path of video file name, needs to have `.webm` extension.
 * @returns {callback} config.callback - Optional callback to return when video done processing. It returns the converted webm path name. Same as `config.outputFullPathName` input.
 */
const convertToVideo = function({ src, outputFullPathName }) {

  // ffmpeg -i inputfile -vf "scale=-1:360" -c:v libx264 -preset ultrafast -crf 40 output.mp4
  // executing ffmpeg comand - mp4

  return new Promise((resolve, reject) => {
    ffmpeg(src)
      .output(outputFullPathName)
      .withVideoCodec('libx264')
    // for details on the ffmpeg flags see https://trac.ffmpeg.org/wiki/Encode/H.264
      .addOptions([ '-preset ultrafast', '-f mp4', '-vf scale=-1:360', '-crf 28', '-tune zerolatency', '-movflags +faststart' ])
    // .withVideoBitrate(1024)
      .withAudioCodec('aac')
      .on('end', () => {
        resolve(outputFullPathName);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
};

module.exports = convertToVideo;