/**
* @module convertPocketsphinxOutputToJson
* @description Function to converts pocketSphinx transcription into autoEdit transcription json
*  it has not dependencies as it is only parsing the text.
* @author Pietro Passarelli
*
* @example <caption>Example Pocketsphinx output </caption>

and then may dispose of this that you could this victim in chest when you read back when the government accountability project
<s> 0.070 0.090 0.996306
and 0.100 0.230 0.850170
then 0.240 0.530 0.927457
<sil> 0.540 0.940 0.996306
may 0.950 1.250 0.063430
dispose 1.260 1.750 0.045837
of 1.760 2.010 0.093905
this 2.020 2.290 0.128293
that(2) 2.300 2.480 0.291638
you 2.490 2.610 0.338197
could 2.620 2.830 0.151054
<sil> 2.840 2.960 0.837093
this 2.970 3.340 0.669820
<sil> 3.350 3.380 0.565092
victim 3.390 3.860 0.109049
in 3.870 4.300 0.197427

...

* to autoEdit json
* @example <caption>Example usage </caption>
   [
            {
              "id": 0,
              "text": "and",
              "startTime": 12.09,
              "endTime": 12.36
            },
            {
              "id": 1,
              "text": "like",
              "startTime": 12.36,
              "endTime": 12.53
            },

            ...
*/
'use strict';

/**
* @function convertPocketsphinxOutputToJson
* @description converts pocketSphinx transcription into autoEdit transcription json
* @param {string} data - string, pocketsphinx speech to text recognition, see example above.
* @returns {callback}  - reutns an autoEdit json transcription, see example. Callback optional if synchronous.
*/
function convertPocketsphinxOutputToJson(data) {
  var pocketsphinxTimecodedLine = /<s>|<\/s>/g;
  var pocketSphinxResultArray = data.split(pocketsphinxTimecodedLine);
  const wordsResults = [];
  let lineResults = [];
  let wordIdCounter = 0;
  pocketSphinxResultArray.forEach(function (line) {
    //excluding pocketsphinx sentences
    if (line.split('\n').length > 3 ) {
      var lineAr = line.split('\n');
      //iterating over words
      lineAr.forEach((pocketSphinxWordString) => {
        if (pocketSphinxWordString !== '') {
          const wordAr = pocketSphinxWordString.split(' ');
          const text = wordAr[0];
          //a condition if word is not a empty string. and other pocketsphinx symbols
          if (text !== '' && text !== '<sil>' && text !== '[SPEECH]') {
            const word = {
              text: text.replace(/\([0-9]+\)/g, ''),
              start: parseFloat(wordAr[1]),
              end: parseFloat(wordAr[2]),
              accuracy: parseFloat(wordAr[3]),
              id: wordIdCounter
            };
            //removing (2) (3) accourances, which are pocketsphinx notice of use of alternate word in dictionary / model.
            wordIdCounter += 1;
            lineResults.push(word);
          }
        }
      });
      wordsResults.push(lineResults);
      lineResults = [];
    }
  });

  return wordsResults;
}

module.exports = convertPocketsphinxOutputToJson;