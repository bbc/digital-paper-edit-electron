# Deepspeech STT Electron Integration ADR

adding support for Mozilla DeepSpeech, for higher quality STT for offline recognition.
[`deepspeech-node-wrapper`](https://github.com/pietrop/deepspeech-node-wrapper)

problem as discussed in this ADR is the size of the model is 1.8gb

previously open source offline STT integrated with electron [pocketsphinx]() where model is self contained in npm, as it's not very bick. And Gentle, that [requires spinning up a separate app](), eg as used in [autoEdit]().

<!-- 1.0.8-alpha.3 -->