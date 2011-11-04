(function(WebInspector, undefined) {

    var __slice = Array.prototype.slice;
    function log() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return typeof console !== "undefined" && console !== null ? typeof console.log === "function" ? console.log.apply(console, args) : void 0 : void 0;
    };
    function warn() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return typeof console !== "undefined" && console !== null ? typeof console.warn === "function" ? console.warn.apply(console, args) : void 0 : void 0;
    };
    function error() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return typeof console !== "undefined" && console !== null ? typeof console.error === "function" ? console.error.apply(console, args) : void 0 : void 0;
    };

    var devsync = {
        init_sync_button: function (resource_panel) {
            // called during the initialization of resource panel
            devsync._syncButton = new WebInspector.StatusBarButton(
                WebInspector.UIString("Sync with localhost"),
                "refresh-storage-status-bar-item"
            );
            log('initializing the sync button');

            devsync._syncButton.addEventListener("click", function (event) {
                log("clicked on the sync button")
                devsync.sync(resource_panel);
            }, false);
        },
        button_initialized: false,
        append_to_status_bar_list: function (lst, resource_panel) {
            if (devsync.button_initialized === false) {
                devsync.init_sync_button(resource_panel);
                devsync.button_initialized = true;
            }
            log('appending the button to resource panel');
            return lst.slice(0).push(devsync._syncButton.element);
        },
        on_event: function (event, insp) {
            // in the inspector, to register the global shortcut.
            var modifiers = WebInspector.KeyboardShortcut.Modifiers;
            var shortcutKey = WebInspector.KeyboardShortcut.makeKeyFromEvent(event);
            // register Ctrl+Alt+s
            if (shortcutKey == WebInspector.KeyboardShortcut.makeKey("s", modifiers.Ctrl | modifiers.Alt)) {
                log("sync: ", event, insp.panels.resources);
                devsync.sync(insp.panels.resources);
                return true;
            }
            return false;
        },
        setup_socket: function (pageagent) {
            // try connecting till successful
            function wait_for_refresh(con) {
                if (!con) { return; }

                con.on('refresh', function (data) {
                    pageagent.reload(false);
                });
            }

            function till_connect() {
                var con = io.connect('http://localhost:9889');
                if (con) {
                    wait_for_refresh(con);
                    return;
                }
                setTimeout(till_connect, 5000);
            }
            log("setting up socket for page refresh");
            till_connect();
        },
        populated: false,
        sync: function(resourcePanel) {

            // find the modified resources (path and content)

            log('resource');
            if (devsync.populated === false) {
                // might not be populated the first time.
                log('populating resources');
                resourcePanel._populateResourceTree();
                devsync.populated = true;
            }

            function modified_file_list() {
                var results = [];
                warn('resourcespane: ', resourcePanel);

                resourcePanel._forAllResourceTreeElements(function (treeElement) {
                    var res = treeElement.representedObject;

                    if (res.history.length == 0) {
                        return;
                    }
                    log(res);

                    results.push([res.path, res.content]);
                    return;
                });

                return results;
            }
            log('fetching modified files');
            var list = modified_file_list();

            function errorHandler(e) {
                var msg = '';
                // log(e);
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

                log('Error: ' + msg);
            }

            // todo: can we do better than this hack.
            // http://stackoverflow.com/questions/6664967/how-to-give-a-blob-uploaded-as-formdata-a-file-name
            // http://stackoverflow.com/questions/5938842/cross-domain-ajax-post-in-chrome
            function fupload(path, blob) {
                var form = new FormData(),
                request = new XMLHttpRequest();
                log('upload path:', path);
                form.append('path', path);
                form.append('blob', blob);
                request.open(
                    'POST',
                    'http://localhost:9888/upload', // :(
                    true
                );
                request.send(form);
            }

            window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
            // Note: window.WebKitBlobBuilder in Chrome 12.
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

            for (var i=0; i<list.length; i++) {
                // warn(list[i][0], list[i][1]);

                // Create a new Blob and write it to log.txt.
                var bb = new window.WebKitBlobBuilder();
                bb.append(list[i][1]);

                fupload(list[i][0], bb.getBlob('text/plain'));
            }

        }
    };

    devsync.setup_socket(window.PageAgent)

    WebInspector.devsync = devsync;
})(WebInspector);
