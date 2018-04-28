timestamp() {
  date +"%s"
}
cd /home/pi/timelapse
# take the picture
raspistill -n -o img/last.jpg
IMG_NAME=$(timestamp).jpg
IMG_PATH=img/$IMG_NAME
# make a uniquely named copy
cp img/last.jpg $IMG_PATH
# upload it to google drive
/home/pi/.nvm/versions/node/v9.8.0/bin/node uploader.js $IMG_PATH $IMG_NAME 1sRnz0ygxJq6UyqCdXJktYjwBQNS6oMKa && rm $IMG_PATH
