'use strict';
// used to make HTTP requests
const request = require('request');      
// used to write/read to the filesystem
const fs = require('fs');
// used to keep ours paths correct with out root
const path = require('path');            
// used to unzip the downloaded file and extract the content
const unzip = require('unzip');          
// used to get the downloads folder
const downloadsFolder = require('downloads-folder');
// this allows me to use a .env file to keep my keys safe
require('./node_modules/dotenv/lib/main').config();  

// downloaded file to be saved in the downloads directory
const filename = `${path.join(downloadsFolder(), `preOrder-purchase-survey-download.zip`)}`;
const qualtricsSurveyID = process.env.qualtricsSurveyID;
const qualtricsAPIToken = process.env.qualtricsAPIToken;
const qualtricsHostname = 'https://eu.qualtrics.com';
const qualtricsAPIEndpoint = '/API/v3/responseexports';

const fileFormat = "csv"
const downloadRequestPayload = '{"format":"' + fileFormat + '","surveyId":"' + qualtricsSurveyID + '"}'
const baseUrl = `${qualtricsHostname}${qualtricsAPIEndpoint}`;
const headers = {
    "x-api-token": qualtricsAPIToken,
    "content-type": "application/json"
};
const options = {
    "body": downloadRequestPayload,
    "headers": headers
};
let writable = fs.createWriteStream(filename);
let requestCheckProgress = 0
let progressStatus = "in progress"
/**
 * This will be called when the progress reached 100%
 * @param {*} progressId - the id of the file to download given from the initial post request
 */
const DownloadFile = (progressId) => {
    let requestDownloadUrl = `${baseUrl}/${progressId}/file`;
    let ops = {
        "url": requestDownloadUrl,
        "headers": headers
    }
    request(ops, function (error, res, body) { 
    })
    .pipe(writable) 
    // this will create the zip file if it does not exist, 
    // it will overwrite the data if it does exist

    // when the writable file is finished, this event gets triggered
    writable.on("close", () => {
        // read the file and unzip it
        fs.createReadStream(filename)
            .pipe(unzip.Parse())
            .on('entry', (entry) => {
                const type = entry.type
                const content_dir = path.join(__dirname, "Content");
                const download_dir = path.join(__dirname, "Content", "data");
                const output_file_name = "qualtrics.json"
                // Check if output path exist, create it if does not
                // ./Content/date
                if (fs.existsSync(content_dir) === false)
                    fs.mkdirSync(content_dir);
                if (fs.existsSync(download_dir) === false)
                    fs.mkdirSync(download_dir);
                if (type === 'File')
                    entry.pipe(fs.createWriteStream(path.join(download_dir, output_file_name)));
                else
                    entry.autodrain();
            })
    })
}
/**
 * This will call itself recursively until the download is finished or an 
 * error occurs
 * 
 * When the download is finished, it will download the file.
 * @param {*} progressId - the id given from the post request to check the download status
 */
const WatchFile = (progressId) => {
    console.log("watching download progress")
    if (requestCheckProgress < 100 && progressStatus != "complete") {
        let requestCheckUrl = baseUrl + "/" + progressId;
        let ops = {
            "url": requestCheckUrl,
            "headers": headers
        }
        request(ops, (error, resp, body) => {
            console.log(resp)
            if (!error && resp.statusCode == 200) {
                var info = JSON.parse(body);
                requestCheckProgress = parseInt(info.result.percentComplete);
                console.log("Download is", requestCheckProgress, "complete");
                if (requestCheckProgress === 100) {
                    progressStatus = "complete";
                    DownloadFile(progressId);
                } else {
                    WatchFile(progressId);
                }
            } else {
                console.log("Status Code", resp.statusCode)
                var info = JSON.parse(body);
                console.log("Error:\n", info.meta.error.errorMessage)
            }
        })
    }
}
/**
 * This is the callback for the post request to start the file download
 * @param {*} error 
 * @param {*} resp 
 * @param {*} body 
 */
const PostCallback = (error, resp, body) => {
    if (!error && resp.statusCode == 200) {
        var info = JSON.parse(body);
        var progressId = info.result.id;
        WatchFile(progressId)
    } else {
        // console.log("Status Code", resp.statusCode)
        // var info = JSON.parse(body);
        // console.log("Error:\n", info.meta.error.errorMessage)
        console.log('hey now')
        console.log(resp)
    }

}
// This starts the request for the file download
request.post(baseUrl, options, PostCallback);

