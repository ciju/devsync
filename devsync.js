var exec_cmd, handle_chromium, id, name, start_refresh_server, start_upload_server, _ref, _ref2;
_ref = {
  'formidable': 'formidable',
  'path': 'path',
  'fs': 'fs',
  'sys': 'sys',
  'http': 'http',
  'walk': 'walk',
  'optimist': 'optimist',
  socket: 'socket.io',
  'child_process': 'child_process'
};
for (id in _ref) {
  name = _ref[id];
  if ((_ref2 = global[id]) == null) {
    global[id] = require(name);
  }
}
start_upload_server = function(port, cwd) {
  var update_local_file;
  update_local_file = function(orig, updt) {
    var orig_f, updt_f;
    orig_f = fs.createWriteStream(orig);
    updt_f = fs.createReadStream(updt);
    updt_f.addListener("data", function(chunk) {
      return orig_f.write(chunk);
    });
    return updt_f.addListener("close", function() {
      return orig_f.end();
    });
  };
  return http.createServer(function(req, res) {
    var form;
    if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
      form = new formidable.IncomingForm();
      return form.parse(req, function(err, fields, files) {
        res.writeHead(204, {
          'content-type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        });
        sys.debug(sys.inspect({
          fields: fields,
          files: files
        }));
        update_local_file(path.join(cwd, fields['path']), files['blob']['path']);
        return res.end();
      });
    }
  }).listen(port);
};
start_refresh_server = function(port, wpath) {
  var io, watch;
  watch = function(dir, fn) {
    var walker;
    sys.debug('dir: ' + dir);
    walker = walk.walk(dir, {});
    walker.on("names", function(root, nodeNames) {
      return nodeNames.sort(function(a, b) {
        if (a === b) {
          return 0;
        } else {
          if (a > b) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    });
    walker.on("file", function(root, fileStats, next) {
      fs.watchFile(path.join(root, fileStats.name), fn);
      return next();
    });
    walker.on("directories", function(root, dirStatsArray, next) {
      return next();
    });
    walker.on("errors", function(root, nodeStatsArray, next) {
      return next();
    });
    return walker.on("end", function() {
      return sys.debug("all done");
    });
  };
  io = socket.listen(port);
  global.cb = null;
  io.sockets.on('connection', function(socket) {
    sys.log('registering refresh socket');
    return global.cb = function() {
      sys.log('called by watcher');
      return socket.emit('refresh');
    };
  });
  return watch(wpath, function() {
    sys.log('path: ' + wpath);
    return typeof cb === "function" ? cb() : void 0;
  });
};
exec_cmd = function(cmd, cb) {
  var child;
  return child = child_process.exec(cmd, function(error, stdout, stderr) {
    if (stderr) {
      console.log(stderr);
    }
    if (stdout) {
      console.log(stdout);
    }
    if (error !== null) {
      return console.log('exec error: ', error, cmd);
    } else {
      return typeof cb === "function" ? cb() : void 0;
    }
  });
};
handle_chromium = function(argv) {
  var cb, chromium_path, opts;
  opts = argv.i != null ? "-f" : argv.r != null ? (cb = function() {}, "-d") : "";
  if (argv.l != null) {
    opts += " -t";
  }
  chromium_path = path.join(__dirname, "chromiumer.sh");
  console.log('options: ', opts);
  return exec_cmd(("cd " + __dirname + "; ") + chromium_path + " " + opts);
};
module.exports.devsync = function() {
  var argv, cwd, watch_path;
  cwd = fs.realpathSync(process.cwd());
  argv = optimist.argv;
  watch_path = argv._ ? fs.realpathSync(argv._) : cwd;
  global.debug = argv.d != null;
  if (!(argv.r != null)) {
    start_upload_server(9888, cwd);
    start_refresh_server(9889, watch_path);
  }
  handle_chromium(argv);
  return sys.log('watch_path: ' + watch_path + '  debug: ' + debug);
};