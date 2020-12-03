# Learnyist Content Drm Remover

### Note:
The Proprietary Drm Implementation of the site, which also includes the decryption functionality and the corresponding driver code has been removed to prevent violating any terms, license or policy of any calibre and the functionality of the POC is highly limited to comply with the same.

## Working Process of Content Streaming in the site.
1. The content for the streaming process is determined.
2. A so called "license" is fetched for the content which is encrypted.
3. The Decryptor is sent the key which might be got from the above step.
4. The Decryptor derives a key and an iv from the sent key.
5. The browser fetches the Dash Manifest for the content.
6. The Manifest is parsed and the audio and video streams are extracted.
7. A chunk size is determined and the audio and video are fetched for that amount of chunksize
8. the starting index of the chunk is taken as offset
9. The Offset and the audio or video chunk is sent to the decryptor for decryption.
10. The decrypted chunk is received and is appended to the input buffer of the video player.
Note: The Proprietary Drm code has been written in C and is compiled to Webassembly using Emscripten.

## Working Principle of the POC
1. The working principle is similar to the functionality of the streaming process in the site except that it decrypts the whole content and helps you download the muxed output.
2. Muxing Process uses the FFmpeg library compiled to webassembly from the following (github.com/bgrins/videoconverter.js/blob/master/build/ffmpeg-all-codecs.js)

## Why Release this?
0. It's irrefutably not for fun!
1. To help bring awareness in the community about implementing Content Security Practices appropriately.