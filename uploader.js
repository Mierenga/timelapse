const fs = require('fs');
const readline = require('readline');
const google = require('googleapis').google;
const OAuth2Client = google.auth.OAuth2;
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'credentials.json';
const CONFIG = require('./config.json');

let BASE_UPLOAD_FOLDER_ID = CONFIG.base_folder_id;

let auth;

args = {
	UPLOAD_PATH: process.argv[2],
	SAVE_NAME: process.argv[3],
	FOLDER_ID: process.argv[4]
}
if (!args.UPLOAD_PATH) {
    console.log('no upload path given.');
    process.exit(1);
}
if (!args.SAVE_NAME) {
    console.log('no save name given.');
    process.exit(1);
}
if (args.FOLDER_ID) {
    BASE_UPLOAD_FOLDER_ID = args.FOLDER_ID;
}

authAndRun(startGoogleDriveOperations);

function authAndRun(run){

	// Load client secrets from a local file.
	fs.readFile('client_secret.json', (err, content) => {
	  if (err) { 
		  console.log('Error loading client secret file:', err);
		  process.exit(1);
	  }
	  // Authorize a client with credentials, then call the Google Drive API.
	  auth = authorize(JSON.parse(content), startGoogleDriveOperations);
	  
	});
}

function startGoogleDriveOperations(auth) {
  const drive = google.drive({version: 'v3', auth});
  //await listFiles(drive);
  uploadFile(drive);
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, cb) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    cb(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
	      console.log(err);
	      process.exit(1);
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (!checkAndHandleError(err)) {
          console.log('Token stored to', TOKEN_PATH);
				}
      });
      return oAuth2Client;
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listFiles(drive) {
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, {data}) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(file.name + ' ' +file.id);
      });
    } else {
      console.log('No files found.');
    }
  });
}

function uploadFile(drive) {

    //let parentFolder = await getSubdirectoryForDate(drive, new Date());
    let fileMetadata = {
      name: args.SAVE_NAME,
      parents: [BASE_UPLOAD_FOLDER_ID]
      //parents: [parentFolder]
    };
    let media = {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(args.UPLOAD_PATH)
    };
    drive.files.create({
       resource: fileMetadata,
       media: media,
       fields: 'id'
    }, function(err, file) {
      if(err) {
        console.log(err);
	process.exit(404);
      } else {
        console.log('File Id: ', file.data.id);
	process.exit(0);
      }
    });
}

function makeFolderNameForDate(date) {
  name = date.toISOString().substring(0,10);
  console.log(name);
  return name;
}

async function findFolderIdByName(drive, parents, name) {

  let q = "name='" + name + "'";
  for (let i = 0; i < parents.length; i++) {
	  q += " and '" + parents[i] + "' in parents";
  }
  let pageToken = null;
  console.log(q);
  drive.files.list({
	  q: q,

	  fields: 'nextPageToken, files(id, name)',
	  spaces: 'drive',
	  pageToken: pageToken
  }, (err, res) => {
		console.log('got response');
	  if (err) {
		console.log('error');
		  console.error(err);
		  process.exit(0);
	} else {
		console.log('no error');
		res.files.forEach((file) => {
			console.log('Found file: ', file.name, file.id);
		});
		console.log('exiting.');
		process.exit(0);
	}
  });

  console.log(name);
}


async function getSubdirectoryForDate(drive, date) {

  let folderName = makeFolderNameForDate(date);
  let folderId = await findFolderIdByName(drive, [BASE_UPLOAD_FOLDER_ID], folderName);
  if (folderId) {
	  return folderId;
  }
  console.log('creating subdirectory for date');
  var fileMetadata = {
     name: folderName,
     mimeType: 'application/vnd.google-apps.folder',
     parents: [BASE_UPLOAD_FOLDER_ID]
  };
  drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }, (err, file) => { 
		if (!checkAndHandleError(err)) {
			console.dir(file);
			console.log('Folder Id: ', file.data.id);
			return file.data.id;
		}
  });
}


/*
 * return true if there is an error
 */
function checkAndHandleError(err) {
	if (err) {
		if (err.errors) {
			console.error(err.errors);
		} else {
			console.error(err);
		}

		return true;
	} 
	return false;
}



