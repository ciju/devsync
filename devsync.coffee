# http://stackoverflow.com/questions/7262869/best-way-to-require-several-modules-in-nodejs
global[id] ?= require name for id, name of {
  'formidable', 'path', 'fs', 'sys', 'http', 'walk',
  'optimist', socket: 'socket.io',
  'child_process'
}

log = (args...) ->
  try
    throw new Error
  catch e
    st = e.stack.split('\n')[2].replace(/\ */, ' ').replace(' at ', '').replace(__dirname+'/', '')
    console.log.apply null, [st].concat args


class UploadServer
  constructor: (port, cwd) ->
    # http://stackoverflow.com/questions/4980243/how-to-copy-a-file
    update_local_file = (orig, updt) ->
      orig_f = fs.createWriteStream orig
      updt_f = fs.createReadStream updt
      updt_f.addListener "data", (chunk) -> orig_f.write(chunk)
      updt_f.addListener "close", -> orig_f.end()

    @server = http.createServer((req, res) ->
      if req.url == '/upload' and req.method.toLowerCase() == 'post'
        # parse a file upload
        form = new formidable.IncomingForm()
        form.parse req, (err, fields, files) ->
          res.writeHead(204, {'content-type': 'text/plain', 'Access-Control-Allow-Origin': '*'})
          # sys.debug(sys.inspect({fields: fields, files: files}))
          update_local_file(path.join(cwd, fields['path']), files['blob']['path'])
          res.end()
    )
    @server.listen port
    log 'upload: started upload server'

  close: ->
    @server.close()
    log 'upload: closed upload server'

class RefreshServer
  constructor: (port, wpath) ->
    watch = (dir, fn) ->
      walker = walk.walk(dir, {})

      walker.on "names", (root, nodeNames) ->
        nodeNames.sort (a, b) -> if a==b then 0 else (if a>b then 1 else -1)

      walker.on "file", (root, fileStats, next) ->
        fs.watchFile(path.join(root, fileStats.name), fn)
        next()

      walker.on "directories",  (root, dirStatsArray, next) -> next()
      walker.on "errors",  (root, nodeStatsArray, next) -> next()
      walker.on "end", -> log("refresh: closed refresh server")

    # start the refresh connection
    io = socket.listen port
    global.cb = null

    io.sockets.on 'connection', (socket) ->
      log 'refresh: registering refresh socket'
      global.cb = ->
        log 'refresh: refresh request'
        socket.emit 'refresh'

    watch wpath, ->
      log 'path: '+ wpath
      cb?()


exec_cmd = (cmd, opts) ->
  log 'cmd: ', cmd, ' opts: ', opts
  child = child_process.spawn cmd, opts, {cwd: __dirname}
  child.stdout.on 'data', (data) -> process.stdout.write(data)
  child.stderr.on 'data', (data) -> process.stderr.write(data)
  child.on 'exit', ->
    process.kill process.pid, 'SIGINT'

handle_chromium = (argv) ->
  opts = []
  if argv.i?             #reinstall
    opts.push("-f")
  else if argv.r?               #remove
    cb = ->
    opts.push("-d")

  if argv.l?                    #local: for testing (see the shell script)
    opts.push("-t")

  log 'options: ', opts
  exec_cmd "devsync-chromium", opts


module.exports.devsync = ->
  cwd = fs.realpathSync process.cwd()
  argv = optimist.argv
  watch_path = if argv._ then fs.realpathSync(argv._) else cwd

  global.debug = argv.v?

  if not argv.r?      #if remove chromium, then no need to run servers
    ups = new UploadServer 9888, cwd
    new RefreshServer 9889, watch_path

  process.on 'uncaughtException', ->
    log 'uncaughtException: Blame it on ciju.ch3rian@gmail.com, some details would be appreciated.'
    process.exit()
  process.on 'SIGTERM', ->
    log 'termination signal. do stuff'
    process.exit()
  process.on 'SIGINT', =>
    ups?.close()
    process.exit()

  log 'setting up chromium: please wait'
  handle_chromium(argv)

