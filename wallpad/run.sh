#!/usr/bin/with-contenv bashio

CONFIG_PATH=/data/options.json
#SHARE_DIR=/share
#JS_FILE=socket.js
#
#if [ ! -f $SHARE_DIR/$JS_FILE ]; then
#  LS_RESULT=`ls $SHARE_DIR | grep socket.js`
#  if [ $? -eq 0 ]; then
#    rm $SHARE_DIR/socket.js
#  fi
#  cp

node /src/socket.js
