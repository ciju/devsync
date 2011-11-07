# Sync WebInspector edits with localhost

The hack is basically a bridge between chrome ```devtools``` (WebInspector) and localhost editing.

As web developers, we spend quite some time on ```devtools``` (if using chrome). Each time, we try some changes on the site, replicate them to files on the localhost, and then again switch back to the browser and do refresh. This hack tries to make the cycle simpler. Do the edits in ```devtools```, once you are ready, push a button (or a keyboard shortcut 'Ctrl+Alt+s' ) and the changes will go back to the localhost files (js and css changes) and site itself will be refreshed. And yes, editing the localhost file also refreshes the page on browser (ex: just Alt+Tab to it).

## How to make it work:
You would need node.js and npm for this to work. If you have both installed, all you need is to execute
```sudo npm install -g https://github.com/ciju/devsync/tarball/master```. Successful installation will make ```devsync``` command available on the system.

To use it, run it from you project directory. The first time it runs, it will download an instance of ```chromium``` and patch ```devtools``` to allow file sync. This will bring up an instance of ```chromium```, on which you can edit css/js. You also need to run you default localhost server (ex: whatever you run while testing/developing your app/site on localhost). 

Once you are ready with the changes to be saved, use the button pointed in the image below or keyboard shortcut ```'Ctr+Alt+s'```.

<img src="https://github.com/ciju/devsync/raw/master/screenshot.jpg">

If your generated files are hosted from a separate directory (ex: jekyll servers), you can specify the directory as a parameter ex: ```devsync _site\```.

A ```test-site``` is included in the repo. Put its path in apache configuration, run ```devsync``` from its root, and play with it. 

## Internals:

Check the <a href="https://github.com/ciju/devsync/wiki/Internals">wiki page</a>.

## note:
- In the inspector, only the style groups showing the file name save edits to the localhost files.
- Have tested it on linux (Ubuntu). Create issues or send in patch, if you find problems with installing it on Mac.
- Doesn't work on windows.
