# Sync WebInspector edits with localhost

The hack is basically a bridge between chrome devtools (WebInspector) and localhost editing.

As web developers, we spend quite some time on devtools (if using chrome). Each time, we try some changes on the site, replicate them to files on the localhost, and then again switch back to the browser and do refresh. This hack tries to make the cycle simpler. Do the edits in devtools, once you are ready, push a button (or a keyboard shortcut 'Ctr+Alt+s' ) and the changes will go back to the localhost files (js and css changes) and site itself will be refreshed. Editing the localhost file, refreshes the page on browser (ex: just Alt+Tab to it).

## How to make it work:
You would need node.js and npm for this to work. Download/clone this project, and install it as a npm on the root directory of your site ```npm install <devsync directory that you cloned/downloaded>``` . (note: its a big download, 35-40mb :( had to include chrome and devtools in it).

Well, after that, run ```~/node_modules/devsync/upload.js``` from the root directory of the site. This will bring up an instance of chromium browser.

Now, run your localhost webserver (ex: whatever you use to test your site locally) and open the site in the chromium browser.

Once you edited js/css, and are ready for the changes to be saved, click on 'Resources' panel at least once (to activate the keyboard shortcut, i know, its a bug :) and then either use the button highlighted in the image below or keyboard shortcut 'Ctr+Alt+s'.

<img src="https://github.com/ciju/devsync/raw/master/screenshot.jpg">

## How it works:

There are basically two parts to the hack. One is to figure out the files changed, in the devtools, and update them on the localhost. Second part is to refresh the browser, whenever the localhost files change.

For first part, we hack into devtools, to figure out the files, and upload them to a nodejs app, which based on the path provided, and the current directory, updates the files.

For second part, we use socket.io library, in nodejs, to talk with the chrome devtools via websockets.

I know, pretty ugly hack :)

If you wana play with the muck, search for 'ciju' in the devtools directory. Rest of the magic is happening in upload.js

## notes:
- for the keyboard shortcut to work, the 'Resources' panel needs to be clicked once
- in the inspector, only the style groups showing the file name (ex: 'default.css:5') saves edits to the localhost files.

## todo:
- cleanup and organize code
- fix the issue with keyboard shortcut. Ex: clicking (once) the 'Resources' panel.

