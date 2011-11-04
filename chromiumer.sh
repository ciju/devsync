#!/bin/bash

# To install a chromium version.
# 1) detect the os type
# 2) create a directory
# 3) download both the chromium and devtools for same build to the install directory
# 4) patch the devtools

OS=`uname -s 2>/dev/null`
echo "Checking the OS type"
if [[ "$OS" == 'Linux' ]]; then
    APP="chrome-linux.zip"
elif [[ "$OS" == 'Darwin' ]]; then
    OS="Mac"
    APP="chrome-mac.zip"
else
    echo "ERROR"
    echo "Couldn't figure out the OS or doesn't support it"
    exit 1
fi
echo "OS type: $OS"

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
    echo "deleting chromium build $REV"
    rm -rf "$INSTALLPATH"
    exit 0
fi

if [ ! "$REV" ]; then
  echo -n "Checking latest Chromium version..."
  REV=$(curl -s "$URLBASE/LAST_CHANGE")
  if [[ "$REV" =~ ^[0-9]+$ ]]; then
    echo "OK"
  else
    echo "ERROR"
    echo "Error loading revision data from $URLBASE/LAST_CHANGE, aborting update."
    exit 1
  fi
fi

echo "Attempting to update Chromium to revision $REV..."

CPATH="$INSTALLPATH/chromium"
DPATH="$INSTALLPATH/devtools"

exec_app() {
    echo "executing chrome with patched devtools"
    if [[ "$OS" == "Linux" ]]; then
        BIN="$CPATH/chrome"
    elif [[ "$OS" == "Darwin" ]]; then
        BIN="$CPATH/Chromium.app/Contents/MacOS/Chromium"
    fi
    echo "binary: $BIN       with: $DPATH"
    "$BIN" --debug-devtools-frontend="$DPATH"  --remote-debugging-port=9222 &
}

if [[ -d "$CPATH" && -d "$DPATH" && ! "$FORCE" ]]; then
    echo "Build $REV of chromium already exists"
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
  echo "Error downloading $APP, aborting update."
  rm -rf "$TMP"
  exit 1
fi

if [ ! -f "$TMP/$DEV" ]; then
  echo "Error downloading $DEV, aborting update."
  rm -rf "$TMP"
  exit 1
fi

echo -n "Deleting existing files..."
# rm -rf "$INSTALLPATH/Chromium.app" "$INSTALLPATH/chromium"
rm -rf "$INSTALLPATH"
echo "OK"

echo -n "Creating new files..."
echo "paths: $CPATH - $DPATH"
# mkdir -p "$CPATH"  # later move takes care of this
mkdir -p "$DPATH"
unzip -qo "$TMP/$DEV" -d "$DPATH"
unzip -qo "$TMP/$APP" -d "$TMP"
echo "OK"


# path devtools
WD=`pwd`
PD="$PWD/patch-devtools"
echo "patch directory: $PD"
cp "$PD/devsync.js" "$DPATH/"
cp "$PD/socket.io.min.js" "$DPATH/"
echo "patching $PD/patch.diff to $DPATH"
cd "$DPATH"
patch -p1 < "$PD/patch.diff"
cd -


APPBASE=$(basename "$APP" .zip)
echo "moving $TMP/$APPBASE to $CPATH"
if [[ "$OS" == "Linux" ]]; then
    mv "$TMP/$APPBASE" "$CPATH"
elif [[ "$OS" == "Darwin" ]]; then
    mv "$TMP/$APPBASE/Chromium.app" "$CPATH"
fi

exec_app

echo -n "Cleaning up..."
rm -rf "$TMP"
echo "OK"

exit 1

echo -n "Modifying Chromium bin file to use --debug-devtools-frontend..."
BINPATH="$INSTALLPATH/Chromium.app/Contents/MacOS"
BIN="$BINPATH/Chromium"
mv "$BIN" "$BINPATH/Chromium-bin"

# cat > "$BIN" <<'EOF'
# #!/bin/bash
# BIN=$(echo $0 | perl -pe 's/$/-bin/')
# DEV=$(echo $0 | perl -pe 's#Chromium\.app.*#chromium/devtools#')
# "$BIN" --debug-devtools-frontend="$DEV"
# EOF
# chmod +x "$BIN"
# echo "OK"


# if [ -f "chromiumer-devtools.sh" ]; then
#   echo "Running chromiumer-devtools.sh..."
#   ./chromiumer-devtools.sh "$DEVTOOLS"
# fi

echo "Done!"
