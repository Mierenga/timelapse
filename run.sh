#!/bin/bash

timestamp() {
  date +"%s"
}

PERSIST=/home/pi/timelapse
RAM=/home/pi/ram/timelapse
NODEJS=/home/pi/.nvm/versions/node/v9.8.0/bin/node
UPLOADER=$PERSIST/uploader.js
LOG=$RAM/run.log
LAST_IMG_PATH=$RAM/last.jpg
UNIQUE_IMG_NAME=$(timestamp).jpg
UNIQUE_RAM_PATH=$RAM/$UNIQUE_IMG_NAME
PERSIST_IMG_PATH=$PERSIST/img/$UNIQUE_IMG_NAME

# prepare RAM
mkdir -p $RAM
touch $LOG

cd $PERSIST

# take the picture
raspistill -n -o $LAST_IMG_PATH >> $LOG

# check the size (if it is too small (too dark), discard)
minimumsize=2000000
actualsize=$(wc -c <"$LAST_IMG_PATH")
if [ $actualsize -le $minimumsize ]; then
    echo $UNIQUE_IMG_NAME : discarding, size is under $minimumsize bytes >> $LOG
    exit 
fi


# make a uniquely named copy
cp $LAST_IMG_PATH $UNIQUE_RAM_PATH >> $LOG

# upload it to google drive
echo -n $UNIQUE_IMG_NAME : >> $LOG
$NODEJS $UPLOADER $UNIQUE_RAM_PATH $UNIQUE_IMG_NAME >> $LOG

if [ "$?" -eq "0" ]; then
    # clean up
    rm $UNIQUE_RAM_PATH >> $LOG
else
    # save it to SD card if upload failed
    mv $UNIQUE_RAM_PATH $PERSIST_IMG_PATH >> $LOG
fi

