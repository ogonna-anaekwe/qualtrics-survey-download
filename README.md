# qualtrics-survey-download
This project downloads the CSV of a specific survey to the users Downloads folder

To run this application, open your terminal and clone this repo using either:
`git clone https://github.com/ogonna-anaekwe/qualtrics-survey-download.git`
*or*
`git clone git@github.com:ogonna-anaekwe/qualtrics-survey-download.git`

Once cloned, open `index.js` using `touch index.js`, and replace the values of the variables with the corresponding *survey id* and *api token* from Qualtrics IDs section of the Account Settings in your Qualtrics account
```
const qualtricsSurveyID = process.env.qualtricsSurveyID;
const qualtricsAPIToken = process.env.qualtricsAPIToken;
```

Then run the following commands:
```
npm init
npm start
```
