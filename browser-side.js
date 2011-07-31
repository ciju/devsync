
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.BlobBuilder = window.WebKitBlobBuilder;

(function () {
    function errorHandler(e) {
            var msg = '';
        console.log(e);
        switch (e.code) {
         case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
         case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
         case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
         case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
         case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
        };

        console.log('Error: ' + msg);
    }

    // http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
    // http://stackoverflow.com/questions/5938842/cross-domain-ajax-post-in-chrome
    function fupload(path, file) {
        var form = new FormData(),
        request = new XMLHttpRequest();
        console.log(path, file);
        form.append('file', file);
        form.append('path', path);
        request.open(
            'POST',
            'http://localhost:8888/upload',
            true
        );
        request.send(form);    
    }

    function send_file(snd_box_path, orig_path) {
        function onInitFs(fs) {
            fs.root.getFile(snd_box_path, {}, function(fileEntry) {
                // Get a File object representing the file,
                // then use FileReader to read its contents.
                fileEntry.file(function(file) {
                    console.log(file);
                    fupload(path, file);
                }, errorHandler);
            }, errorHandler);
        }
        window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs, errorHandler);
    }

    // todo:
    // - get the list of (path, content) pairs
    // - write the content with filename to localfile system
    // - upload content, with path to site
    function write_file(path, content) {
        fs.root.getFile(path.split('\\').pop().split('/').pop(), {create: true}, function(fileEntry) {

            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function(fileWriter) {

                fileWriter.onwriteend = function(e) {
                    console.log('Write completed.');
                };

                fileWriter.onerror = function(e) {
                    console.log('Write failed: ' + e.toString(), e);
                };

                // Create a new Blob and write it to log.txt.
                var bb = new window.WebKitBlobBuilder(); //BlobBuilder(); // Note: window.WebKitBlobBuilder in Chrome 12.
                bb.append(content);
                fileWriter.write(bb.getBlob('text/plain'));
            }, errorHandler);
        }, errorHandler);

        window.requestFileSystem(window.TEMPORARY, 5*1024*1024, onInitFs, errorHandler);
    }
     
    
});

function onInitFs(fs) {

    fs.root.getFile('log.txt', {create: true}, function(fileEntry) {

        // Create a FileWriter object for our FileEntry (log.txt).
        fileEntry.createWriter(function(fileWriter) {

            fileWriter.onwriteend = function(e) {
                console.log('Write completed.');
            };

            fileWriter.onerror = function(e) {
                console.log(e);
                console.log('Write failed: ' + e.toString());
            };

            // Create a new Blob and write it to log.txt.
            var bb = new window.WebKitBlobBuilder(); //BlobBuilder(); // Note: window.WebKitBlobBuilder in Chrome 12.
            bb.append('Lorem Ipsum');
            fileWriter.write(bb.getBlob('text/plain'));

        }, errorHandler);

    }, errorHandler);

}

function errorHandler(e) {
  var msg = '';
    console.log(e);
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}

window.requestFileSystem(window.TEMPORARY, 1024*1024*1024, onInitFs, errorHandler);

function FileUpload(bin) {
  var xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("load", function (e) {
      console.log('something uploaded', e);
  }, false);
  xhr.open("POST", "http://localhost:8888/upload");
  xhr.overrideMimeType('text/plain; charset=x-user-defined-binary');
  xhr.sendAsBinary(bin);
}

// http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
// http://stackoverflow.com/questions/5938842/cross-domain-ajax-post-in-chrome
function fupload(blob) {
    var form = new FormData(),
        request = new XMLHttpRequest();
    form.append("blob",blob);
    form.append("filename", 'testing');
    request.open(
        "POST",
        "http://localhost:8888/upload",
        true
    );
    request.send(form);    
}

// https://gist.github.com/742267
XMLHttpRequest.prototype.sendAsBinary = function(text){
			var data = new ArrayBuffer(text.length);
			var ui8a = new Uint8Array(data, 0);
			for (var i = 0; i < text.length; i++) ui8a[i] = (text.charCodeAt(i) & 0xff);

			var bb = new BlobBuilder(); // doesn't exist in Firefox 4
			bb.append(data);
			var blob = bb.getBlob();
			this.send(blob);
		};

window.requestFileSystem(window.TEMPORARY, 1024*1024, onInitFs, errorHandler);
