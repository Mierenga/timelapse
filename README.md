
# timelapse

A raspberry pi camera timelapse uploader

## configure uploads

- add your Google Drive upload folder to `config.json`

```
{"base_folder_id": "3kg0s0d0kskso00fg00JLD00LD00D0OD0"} 
```

- add your credentials to `credentials.json`
```
{
	"installed": {
		"client_secret":"your-client-secret",
		"client_id":"your-client-id",
		"redirect_uris":["local-redirect-url"]
	}
}
```

## install in crontab

`crontab -e`

- every minute
```
# m h  dom mon dow   command
* * * * * /home/pi/timelapse/run.sh
```

