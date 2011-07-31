var formidable = require('formidable'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    walk = require('walk'),
    sys = require('sys');

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
    var cwd = process.cwd();
    
    if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
        // parse a file upload
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            res.writeHead(204, {'content-type': 'text/plain'});
            sys.debug('recieved: ');
            sys.debug(sys.inspect({fileds: fields, files: files}));
            // sys.debug('path orig: ' + path.join(cwd, fields['path']));
            // sys.debug(' from: '+ files['blob']['path']);
            update_original_with(path.join(cwd, fields['path']), files['blob']['path']);
            res.end();
        });
        return;
    }

}).listen(8888);


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


var io = require('socket.io').listen(8889);

var cb = null;

io.sockets.on('connection', function (socket) {
    sys.debug('asigning');
    cb = function () {
        sys.debug('called by watcher');
        socket.emit('refresh');
    };
    sys.debug(cb);
});

watch(path.join(process.cwd(), '_site'), function (p, n) {
    sys.debug('wjat');
    sys.debug(cb);
    if (cb) {
        cb();
    }
});



