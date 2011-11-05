#!/bin/bash

# To install a chromium version.
# 1) detect the os type
# 2) create a directory
# 3) download both the chromium and devtools for same build to the install directory
# 4) patch the devtools

log() {
    echo "   chromium: $1"
}

OS=`uname -s 2>/dev/null`
if [[ "$OS" == 'Linux' ]]; then
    APP="chrome-linux.zip"
elif [[ "$OS" == 'Darwin' ]]; then
    OS="Mac"
    APP="chrome-mac.zip"
else
    log "ERROR"
    log "Couldn't figure out the OS or doesn't support it"
    exit 1
fi
log "OS type: $OS"

for option in "$@"; do
    case ${option} in
        -f) FORCE=1;;
        -d) DELETE=1;;
        -t) TEST=1;;
    esac
done

URLBASE="http://commondatastorage.googleapis.com/chromium-browser-continuous/$OS"
DEV="devtools_frontend.zip"
REV=$1
REV="106933"                    # remove this later

INSTALLPATH="$HOME/.devsync/$REV"

if [ "$DELETE" ]; then
    log "Deleting chromium build $REV"
    rm -rf "$INSTALLPATH"
    exit 0
fi

if [ ! "$REV" ]; then
    log "Checking latest Chromium version..."
    REV=$(curl -s "$URLBASE/LAST_CHANGE")
    if [[ "$REV" =~ ^[0-9]+$ ]]; then
        log "Done"
    else
        log "ERROR"
        log "Error loading revision data from $URLBASE/LAST_CHANGE, aborting update."
        exit 1
    fi
fi

log "Attempting to update Chromium to revision $REV..."

CPATH="$INSTALLPATH/chromium"
DPATH="$INSTALLPATH/devtools"

exec_app() {
    if [[ "$OS" == "Linux" ]]; then
        BIN="$CPATH/chrome"
    elif [[ "$OS" == "Darwin" ]]; then
        BIN="$CPATH/Chromium.app/Contents/MacOS/Chromium"
    fi
    log "Executing chrome with patched devtools. bin: $BIN, devtools: $DPATH"
    #   --remote-debugging-port=9222 
    "$BIN" --debug-devtools-frontend="$DPATH" &
}

if [[ -d "$CPATH" && -d "$DPATH" && ! "$FORCE" ]]; then
    log "Build $REV of chromium already exists"
    exec_app
    exit 0
fi

TMP=$(mktemp -d "/tmp/chromiumer.XXXXX")
if [[ ! "$TEST" ]]; then
    curl "$URLBASE/$REV/{$APP,$DEV}" --progress-bar --location --output "$TMP/#1"
else
    cp "/tmp/$APP" "$TMP/$APP"
    cp "/tmp/$DEV" "$TMP/$DEV"
fi

if [ ! -f "$TMP/$APP" ]; then
  log "Error downloading $APP, aborting update."
  rm -rf "$TMP"
  exit 1
fi

if [ ! -f "$TMP/$DEV" ]; then
  log "Error downloading $DEV, aborting update."
  rm -rf "$TMP"
  exit 1
fi

log "Deleting existing files..."
rm -rf "$INSTALLPATH"
log "Done"

log "Creating new files... at $INSTALLPATH"
# mkdir -p "$CPATH"  # later move takes care of this
mkdir -p "$DPATH"
unzip -qo "$TMP/$DEV" -d "$DPATH"
unzip -qo "$TMP/$APP" -d "$TMP"
log "Done"


# path devtools
WD=`pwd`
PD="$PWD/patch-devtools"
log "Patching $PD/ to $DPATH"
cp "$PD/devsync.js" "$DPATH/"
cp "$PD/socket.io.min.js" "$DPATH/"
cd "$DPATH"
patch -p1 < "$PD/patch.diff"
cd -


APPBASE=$(basename "$APP" .zip)
log "Moving $TMP/$APPBASE to $CPATH"
if [[ "$OS" == "Linux" ]]; then
    mv "$TMP/$APPBASE" "$CPATH"
elif [[ "$OS" == "Darwin" ]]; then
    mv "$TMP/$APPBASE/Chromium.app" "$CPATH"
fi

exec_app

log  "Cleaning up..."
rm -rf "$TMP"
log "All Done"

exit 1

# log "Modifying Chromium bin file to use --debug-devtools-frontend..."
# BINPATH="$INSTALLPATH/Chromium.app/Contents/MacOS"
# BIN="$BINPATH/Chromium"
# mv "$BIN" "$BINPATH/Chromium-bin"

# cat > "$BIN" <<'EOF'
# #!/bin/bash
# BIN=$(log $0 | perl -pe 's/$/-bin/')
# DEV=$(log $0 | perl -pe 's#Chromium\.app.*#chromium/devtools#')
# "$BIN" --debug-devtools-frontend="$DEV"
# EOF
# chmod +x "$BIN"
# log "Done"


# if [ -f "chromiumer-devtools.sh" ]; then
#   log "Running chromiumer-devtools.sh..."
#   ./chromiumer-devtools.sh "$DEVTOOLS"
# fi
