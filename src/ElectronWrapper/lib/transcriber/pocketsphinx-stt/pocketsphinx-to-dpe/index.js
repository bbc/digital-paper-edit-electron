function flatten2DArray(oldArray) {
  return Array.prototype.concat.apply([], oldArray);
}

// at the moment this uses the 'sentence boundaries' as decided by pocketsphinx,
// it doesn't use punctuation to calculate the paragraphs.
function generateParagraphs(lines) {
  return lines.map((line, index) => {
    return {
      'id': index,
      'start': line[0].start,
      'end': line[line.length - 1].end,
      'speaker': 'U_UKN'
    };
  });
}

function convertPocketsphinxOutputToDpe(lines) {

  const paragraphs = generateParagraphs(lines);
  const words = flatten2DArray(lines);

  return { words, paragraphs };
}
module.exports = convertPocketsphinxOutputToDpe;