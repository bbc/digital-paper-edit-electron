function convertMillisecondToSecond(millisecond) {
  var second = millisecond / 1000;

  return second;
}

function reorganisedWords(words) {
  return words.map((sw, index) => {
    return {
      id: index,
      text: sw.text,
      start: parseFloat(convertMillisecondToSecond(sw.start)),
      end: parseFloat(convertMillisecondToSecond(sw.end))
    };
  });
}

const addSpeakerIdToWords = (words) => {
  const wordsResults = [];
  let paragraphId = 0;
  const reorgedWords = reorganisedWords(words);
  reorgedWords.forEach((word) => {
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

    const wordsListForParagraph = wordsList.filter((word)=>{
      return word.paragraphId == paraId;
    })

    const firstWord = wordsListForParagraph[0]

    const lastWord = wordsListForParagraph[wordsListForParagraph.length-1];

    paragraph.start = firstWord.start;
    paragraph.end = lastWord.end;
    paragraph.speaker = 'U_UKN';
    paragraphs.push(paragraph);
    paragraph = {};
  });

  return paragraphs;
};

const convert = (data) => {
  const { words } = data;
  const wordsReorged = reorganisedWords(words);
  const paragraphs = generateDpeParagraphs(data.words);

  return { words: wordsReorged, paragraphs };
};
module.exports = convert;