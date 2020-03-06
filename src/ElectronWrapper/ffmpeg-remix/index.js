const async = require('async');
const ffmpeg = require('fluent-ffmpeg');
const tmp = require('tmp');
const debug = require('debug');
const d = debug('ffmpeg-remix');
tmp.setGracefulCleanup();

const ingest = (data, tmpDir) => {
    if(data.ffmpegPath){
      ffmpeg.setFfmpegPath(data.ffmpegPath);
    }
    return (input, callback) => {
      const ff = ffmpeg(input.source);
  
      if (input.start) {
        ff.seekInput(input.start);
      } else {
        input.start = 0;
      }
  
      if (input.end) input.duration = input.end - input.start;
      if (input.duration) ff.duration(input.duration);

      input.path = tmp.fileSync({
        dir:     tmpDir.name,
        prefix:  'ingest-',
        postfix: '.ts'
      }).name;
  
    //   ff.audioCodec('copy').videoCodec('copy');
      ff.videoCodec('libx264').audioCodec('aac')

      ff.output(input.path);
  
      ff.on('start', (commandLine) => {
        d(`Spawned: ${commandLine}`);
      });
  
      ff.on('error', (err, stdout, stderr) => {
        d(err);
        callback(err, null);
      });
  
      ff.on('end', () => {
        d(`Created: ${input.path}`);
        callback(null, input);
      });
  
      ff.run();
    };
  };
  
  
  const concat = (data, tmpDir, callback) => {
    if(data.ffmpegPath){
      ffmpeg.setFfmpegPath(data.ffmpegPath);
    }
    return (err, ingest) => {
      const ff = ffmpeg();
  
      const input = [];
      for (const segment of ingest) {
        input.push(segment.path);
      }
  
      ff.input(`concat:${input.join('|')}`);
      ff.output(data.output);
  
      ff.on('start', (commandLine) => {
        d(`Spawned: ${commandLine}`);
      });
  
      ff.on('error', (err, stdout, stderr) => {
        d(err);
        tmpDir.removeCallback();
        callback(err);
      });
  
      ff.on('end', () => {
        d(`Created: ${data.output}`);
        tmpDir.removeCallback();
        callback(null, data);
      });
  
      ff.run();
    };
  };
  

module.exports = function (data, callback) {
  const tmpDir = tmp.dirSync({
      unsafeCleanup: true
  });

  if (data.limit) {
    async.mapLimit(data.input, data.limit, ingest(data, tmpDir), concat(data, tmpDir, callback));
  } else {
    async.map(data.input, ingest(data, tmpDir), concat(data, tmpDir, callback));
  }
}