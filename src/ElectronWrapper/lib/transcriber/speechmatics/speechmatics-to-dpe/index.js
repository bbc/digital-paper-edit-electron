/**
 * Speechmatics seems to be more accurate then other providers in recognising speakers,
 * eg if there's only one speaker so far in tests it has recognise that ther is only one.
 * This makes it somewhat less efficient to use speaker diarization to break paragraphs, so using punctuation instead
 */
'use strict';

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normaliseWords(words) {
  return words.map((word) => {
    return {
  		text: word.name,
      start: parseFloat(word.time),
      end: parseFloat(word.time) + parseFloat(word.duration)
  	};
  });
}

function isPunctuation(text) {
  return text === '.' || text === '!' || text === '?' || text === ',' || text === ';';
}

function appendPunctuationToPreviousWord(normalisedWords) {
  const wordsWithPunctuation = [];
  normalisedWords.forEach((word, index) => {
    if (isPunctuation(word.text)) {
      // append to previous word
      wordsWithPunctuation[wordsWithPunctuation.length - 1].text += word.text;
    }
    else {
      wordsWithPunctuation.push(word);
    }
  });

  return wordsWithPunctuation;
}

function addIdToWords(list) {
  return list.map((item, index) => {
    item.id = index;

    return item;
  });
}

const addSpeakerIdToWords = (words) => {
  const wordsResults = [];
  let paragraphId = 0;
  // const reorgedWords = reorganisedWords(words);
  words.forEach((word) => {
    // if word contains punctuation
    if (/[.?!]/.test(word.text)) {
      word.paragraphId = paragraphId;
      wordsResults.push(word);
      paragraphId += 1;
    } else {
      word.paragraphId = paragraphId;
      wordsResults.push(word);
    }
  });

  return wordsResults;
};

const generateDpeParagraphs = (words) => {
  const wordsList = addSpeakerIdToWords(words);
  const paragraphs = [];
  let paragraph = {};

  const paragraphIdsList = wordsList.map((paragraph) => {
    return paragraph.paragraphId;
  });

  const paragraphIdsListUniqueValues = [ ...new Set(paragraphIdsList) ];

  paragraphIdsListUniqueValues.forEach((paraId) => {

    const wordsListForParagraph = wordsList.filter((word) => {
      return word.paragraphId == paraId;
    });

    const firstWord = wordsListForParagraph[0];

    const lastWord = wordsListForParagraph[wordsListForParagraph.length - 1];

    paragraph.start = firstWord.start;
    paragraph.end = lastWord.end;
    paragraph.speaker = 'U_UKN';
    paragraphs.push(paragraph);
    paragraph = {};
  });

  return paragraphs;
};

function findSpeakerForParagraph(speakers, paragraph) {
  const result = speakers.find((speaker) => {
    if (( paragraph.start >= speaker.start ) && (paragraph.end <= speaker.end)) {
      return speaker;
    }
  });

  return result ? result : { text: 'U_UKNNNN' };
}

function addSpeakerLabelToParagraphs(speakers, paragraphs) {
  return paragraphs.map((paragraph) => {
    const speakerForParagraph = findSpeakerForParagraph(speakers, paragraph);
    paragraph.speaker = speakerForParagraph.text;

    return paragraph;
  });

}

function convertSpeechmaticsDpe({ words, speakers }) {
  const transcript = {
    paragraphs:[],
    words:[]
  };

  const normalisedWords = normaliseWords(words);
  const wordsWithPunctuation = appendPunctuationToPreviousWord(normalisedWords);
  const wordsWithIds = addIdToWords(wordsWithPunctuation);
  transcript.words = deepCopy(wordsWithIds);
  const dpeParagraphs = generateDpeParagraphs(wordsWithIds);
  const normalisedSpeakers = normaliseWords(speakers);
  transcript.paragraphs = addSpeakerLabelToParagraphs(normalisedSpeakers, dpeParagraphs);

  return transcript;
}

module.exports = convertSpeechmaticsDpe;
