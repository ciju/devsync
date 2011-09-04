#!/usr/bin/env node
var formidable = require('formidable'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    walk = require('walk'),
    sys = require('sys');

var exec = require("child_process").exec;

var lib  = path.dirname(fs.realpathSync(__filename));
var cwd = fs.realpathSync(process.cwd());

var child;

var cmd = path.join(lib, "chrome-linux/chrome --debug-devtools-frontend=" + path.join(lib, "devtools"));


// http://stackoverflow.com/questions/4980243/how-to-copy-a-file
function update_original_with(original, updated) {
    var original_f = fs.createWriteStream(original), 
        updated_f = fs.createReadStream(updated);

    updated_f.addListener("data", function(chunk) {
        original_f.write(chunk);
    });

    updated_f.addListener("close",function() {
        original_f.end();
    });
    
}


http.createServer(function(req, res) {
    
    if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
        // parse a file upload
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            res.writeHead(204, {'content-type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
            // sys.debug('recieved: ');
            sys.debug(sys.inspect({fileds: fields, files: files}));
            // sys.debug('path orig: ' + path.join(cwd, fields['path']));
            // sys.debug(' from: '+ files['blob']['path']);
            update_original_with(path.join(cwd, fields['path']), files['blob']['path']);
            res.end();
        });
        return;
    }

}).listen(9888);

// watches for any change in the localhost files, and runs do_fn on it.
function watch(dir, do_fn) {
    var options,
        walker;

    options = { };

    sys.debug('dir: ' + dir);

    walker = walk.walk(dir, options);

    // walk in sorted order
    walker.on("names", function (root, nodeNames) {
        nodeNames.sort(function (a, b) {
            if (a > b) return 1;
            if (a < b) return -1;
            return 0;
        });
    });

    walker.on("directories", function (root, dirStatsArray, next) {
        next();
    });

    walker.on("file", function (root, fileStats, next) {
        // for each file, start watching it
        fs.watchFile(path.join(root, fileStats.name), do_fn);
        next();
    });

    walker.on("errors", function (root, nodeStatsArray, next) {
        next();
    });

    walker.on("end", function () {
        sys.debug("all done");
    });    
}



// connect with websocket and send refresh command to the page.
var cb = null;
var io = require('socket.io').listen(9889);

io.sockets.on('connection', function (socket) {
    cb = function () {
        sys.log('called by watcher');
        socket.emit('refresh');
    };
});

var watch_path = process.argv[2] ? fs.realpathSync(process.argv[2]) : cwd;

// for jeykll based site use "path.join(process.cwd(), '_site')"
watch(watch_path, function (p, n) {
    sys.log("path: " + watch_path);
    if (cb) { cb(); }
});



child = exec(cmd, function (error, stout, sterr) {
    sys.log("stout: " + stout);
    sys.log("sterr: " + sterr);
    if (error != null) {
        sys.log("error: " + error);
    }
});
