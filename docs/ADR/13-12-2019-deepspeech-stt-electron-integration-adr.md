# Deepspeech STT Electron Integration ADR

adding support for Mozilla DeepSpeech, for higher quality STT for offline recognition.
[`deepspeech-node-wrapper`](https://github.com/pietrop/deepspeech-node-wrapper)

Problem as discussed in [ADR in that repository](https://github.com/pietrop/deepspeech-node-wrapper/blob/master/docs/ADR/2019-12-10-deepspeech-stt.md) is how to package the model, as it's size is 1.8gb

previously open source offline STT integrated with electron [pocketsphinx](https://github.com/OpenNewsLabs/pocketsphinx-stt) where model is self contained in npm, as it's not very big (40MB). And Gentle, that [requires spinning up a separate app](https://autoedit.gitbook.io/user-manual), eg as used in [autoEdit](http://www.autoedit.io/).

<!-- 1.0.8-alpha.3 -->

Decided to add option in settings for downloading Deepspeech as opposed to package it with the electron app, so that it can be optional setup for user once app is installed.

- [x] travis github release deploy for pietrop repo 
- [x] add `deepspeech-node-wrapper`
- [x] add logic to download model under settings in `deepspeech-node-wrapper`
- [x] add logic to download model under settings in electron app
- [x] package/deploy and test 
