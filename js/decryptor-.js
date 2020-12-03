//Here goes the Proprietary code

//key string to typed array conversion and passing the key to the decryptor.

//function for the Decyption of the data

//Downloads the decrypted content
function saveByteArray(reportName, byte) {
  var blob = new Blob([byte], {type: "video/mp4"});
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  var fileName = reportName;
  link.download = fileName;
  link.click();
};

function decrypt(data,chunklength,uri) {

  //i is a psuedo variable to keep track of the chunk split iteration
  i = 0, finalmedia_length = data.length;
  var dataBuffer = new ArrayBuffer(finalmedia_length);
  var finalmedia = new Uint8Array(dataBuffer);
  while (i < finalmedia_length) {
    chunkdata = data.slice(i, i + chunklength);
    l = 0;

	//Create an instance of the decryptor
    var deCrypt = new Decryptor();
    // outbytes is the arraybuffer with final decrypted content
    outbytes = deCrypt.Decrypt(chunkdata, i, uri );
    //console.log(outbytes);
    
    //We convert it to typed array so we can append it to the final buffer which will become the media file
    var outbytes = new Uint8Array(outbytes);

    //k is a psuedo variable to keep track of the append to final media iteration
    for(var k = i; k < i + chunklength && k < finalmedia_length; k++) {
        finalmedia[k] = outbytes[l];
        l++;
    }
    i +=chunklength;
  }
  
  return finalmedia;

}

function muxProcess(audioArray,videoArray) {
  var worker;
  var running = false;
  var isWorkerLoaded = false;
  var isSupported = (function() {
    return window.Worker;
  })();

  function isReady() {
    return !running && isWorkerLoaded;
  }
  
  function startRunning() {
    running = true;
  }
  function stopRunning() {
    running = false;
  }

  function parseArguments(text) {
    text = text.replace(/\s+/g, ' ');
    var args = [];
    // Allow double quotes to not split args.
    text.split('"').forEach(function(t, i) {
      t = t.trim();
      if ((i % 2) === 1) {
        args.push(t);
      } else {
        args = args.concat(t.split(" "));
      }
    });
    return args;
  }

  

  function startWorker(argument) {
    worker = new Worker("./js/worker-asm.js");
    worker.onmessage = function (event) {
      var message = event.data;
      if (message.type == "ready") {
        isWorkerLoaded = true;
        startRunning();
        var args = parseArguments(argument);
        console.log(args);
        worker.postMessage({
          type: "command",
          arguments: args,
          files: [
          {
            "name": "video.mp4",
            "data": videoArray
          },
          {
            "name": "audio.mp4",
            "data": audioArray
          }
        ]
        });
      } else if (message.type == "stdout") {
        console.log(message.data + "\n");
      } else if (message.type == "start") {
        console.log("Worker has received command\n");
      } else if (message.type == "done") {
        stopRunning();
        var buffers = message.data;
        if (buffers.length) {
          //file.data is the muxed output;
          buffers.forEach(function(file) {
            //Download Final Muxed file
            saveByteArray("Decrypted Media", file.data);
        });
        }
        
      }
    };
  }
  //The command to create the muxed file using ffmpeg
  startWorker("-i video.mp4 -i audio.mp4 -c:v copy -c:a copy -shortest -strict experimental output.mp4");

}

function fetchData(uri, callback) {
  //Fetch the Encrypted Data
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && (this.status == 200 || this.status == 206)) {
        // Typical action to be performed when the document is ready:
        var arrayBuffer = xhttp.response; // Note: not oReq.responseText
        if (arrayBuffer) {
          var data = new Uint8Array(arrayBuffer);
        }
        else {
            console.log("Error in getting the Encrypted bytes data, possibly check if the url is valid or does not have any errors.");
        }
        //Chunklength is the chunk size we will split the encrypted media into, because the decryptor engine has been compiled with limited runtime memory constraints. I am splitting the file into 10 different parts just to be sure to handle large files.
        chunklength = Math.floor(data.length/10);
        output = decrypt(data,chunklength,uri);
        callback(output);
      }
      else if (this.status == 500 || this.status == 404) {
        console.log("Error downloading file. Check for validity of the url");
      }
  };
  xhttp.open("GET", uri, true);
  xhttp.responseType = "arraybuffer";
  xhttp.send();
}

function startProcess() {
    //get the url's
    var videoUri = document.getElementById("videouri").value;
    var audioUri = document.getElementById("audiouri").value;
    var encryptKey = document.getElementById("key").value;
    
    /*
    This is declaration code for the compiled decryptor
    Takes in a uint8 typed array encrypted bytes and returns arraybuffer decrypted bytes
    */
    //declare the function to call the key and iv creation process in the compiled code
    //declare the function to call the compiled decryptor with encrypted data

    //fetch ,decrypt the video and audio encrypted data
    fetchData(videoUri, function(data) {
      videoData = data;
    });
    fetchData(audioUri, function(data) {
      audioData = data;
      muxProcess(videoData,audioData);
    });
    

}