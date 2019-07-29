# User Instructions - Draft
Here are some instructions for using a packaged version of the app for desktop, (we still have to draft a user manual for this tool so if anything is not clear let us know so that we can feed it back into it)


You can download the pre release from this link

https://github.com/bbc/digital-paper-edit-electron/releases


1. Click on ‘assets’ and choose the first one that ends with ‘Mac.zip’
 
2. Once you have downloaded the app you need to unzip it 

3. Move it to the applications folder 

3. Right click on the app and click open 

4. Once the app as launched in the top bar ( the one with the Apple logo) you should see an option that says ‘speech to text settings’ click on that and then on ‘edit speech to text configuration’.

A new window should come up where you can set default speech to text service and language, as well as adding the credentials for the service to use for generating transcriptions.

As a side note at the moment the option is between Speechmatics and AssemblyAI.
https://www.speechmatics.com/
https://www.assemblyai.com/
AssemblyAI gives you 5 hours of free trial a months, while Speechmatics only 30 min as a one of.
Speechmatics supports multiple languages while assemblyAI is only in English.

5. Once you have decided which STT you’d like to use and you have made an account and got the API credentials from their dashboards you can add those to the setting view.

Before closing the settings window make sure you have selected a default for speech to text provider and language ( and clicked save) as well as added the credentials for that provider ( and clicked saved)

You can now go back to the main window.

The app comes with two example projects, to make it easier to try it out and evaluate on first use.

6. In the main window you can create a project ( to group your transcripts and paper edits )

7. Once you have done that you can create a transcript and get some audio or video file transcribed.
( at a later stage I might do some optimization so that it could take 5 minutes regardless of how long the media is, by chunking and sending in parallel but not now the speed of the Transcription is dependent on the provider, generally a little less then real-time, assemblyAI might be slightly faster then Speechmatics but not sure)

If you click on the transcript when is ready It is possible to correct the transcript using the editor ( but at the moment this function is not fully integrated with the rest of the system, so would recommend skipping it for now until it is)

8. Once you have a transcripts you can create a programme script ( a paper edit)

9. In the programme script/ paper edit view, you also get access to the transcripts for the project.

You can highlight and annotare, as well as create custom labels.

You can also search and filter ( at the moment with a transcript but in the future across transcripts in a project)

10. In this view where you have transcripts on the left and programme script on the right you can select some text in a transcript and add it to the programme script on the left. By clicking the + button.

It’s possible to rearrange text snippets in the programme script as well as delete.

And you can generate a preview to see how it would flow.

11. When you are done there is an export btn in the programme script, to export for Premiere choose EDL, it stands for edit decision list, you can open it in Premiere as a sequence. 

The clips will be offline, you can then reconnect them in Premiere to continue your edit.


<!-- Hope this is not too detailed, and that is easy to follow. Let me know how you get on and if you got any questions  -->
