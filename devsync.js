var RefreshServer, UploadServer, exec_cmd, handle_chromium, id, log, name, _ref, _ref2;
var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
log = function() {
  var args, st;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  try {
    throw new Error;
  } catch (e) {
    st = e.stack.split('\n')[2].replace(/\ */, ' ').replace(' at ', '').replace(__dirname + '/', '');
    return console.log.apply(null, [st].concat(args));
  }
};
UploadServer = (function() {
  function UploadServer(port, cwd) {
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
    this.server = http.createServer(function(req, res) {
      var form;
      if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
        form = new formidable.IncomingForm();
        return form.parse(req, function(err, fields, files) {
          res.writeHead(204, {
            'content-type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          });
          update_local_file(path.join(cwd, fields['path']), files['blob']['path']);
          return res.end();
        });
      }
    });
    this.server.listen(port);
    log('upload: started upload server');
  }
  UploadServer.prototype.close = function() {
    this.server.close();
    return log('upload: closed upload server');
  };
  return UploadServer;
})();
RefreshServer = (function() {
  function RefreshServer(port, wpath) {
    var io, watch;
    watch = function(dir, fn) {
      var walker;
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
        return log("refresh: closed refresh server");
      });
    };
    io = socket.listen(port);
    global.cb = null;
    io.sockets.on('connection', function(socket) {
      log('refresh: registering refresh socket');
      return global.cb = function() {
        log('refresh: refresh request');
        return socket.emit('refresh');
      };
    });
    watch(wpath, function() {
      log('path: ' + wpath);
      return typeof cb === "function" ? cb() : void 0;
    });
  }
  return RefreshServer;
})();
exec_cmd = function(cmd, opts) {
  var child;
  log('cmd: ', cmd, ' opts: ', opts);
  child = child_process.spawn(cmd, opts, {
    cwd: __dirname
  });
  child.stdout.on('data', function(data) {
    return process.stdout.write(data);
  });
  child.stderr.on('data', function(data) {
    return process.stderr.write(data);
  });
  return child.on('exit', function() {
    return process.kill(process.pid, 'SIGINT');
  });
};
handle_chromium = function(argv) {
  var cb, opts;
  opts = [];
  if (argv.i != null) {
    opts.push("-f");
  } else if (argv.r != null) {
    cb = function() {};
    opts.push("-d");
  }
  if (argv.l != null) {
    opts.push("-t");
  }
  log('options: ', opts);
  return exec_cmd("devsync-chromium", opts);
};
module.exports.devsync = function() {
  var argv, cwd, ups, watch_path;
  cwd = fs.realpathSync(process.cwd());
  argv = optimist.argv;
  watch_path = argv._ ? fs.realpathSync(argv._) : cwd;
  global.debug = argv.v != null;
  if (!(argv.r != null)) {
    ups = new UploadServer(9888, cwd);
    new RefreshServer(9889, watch_path);
  }
  process.on('uncaughtException', function() {
    log('uncaughtException: Blame it on ciju.ch3rian@gmail.com, some details would be appreciated.');
    return process.exit();
  });
  process.on('SIGTERM', function() {
    log('termination signal. do stuff');
    return process.exit();
  });
  process.on('SIGINT', __bind(function() {
    if (ups != null) {
      ups.close();
    }
    return process.exit();
  }, this));
  log('setting up chromium: please wait');
  return handle_chromium(argv);
};