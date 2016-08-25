// bridge icon from http://www.flaticon.com/free-icon/bridge_183375
/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
// curl -X GET --header "Accept: application/json" "https://api.multco.us/bridges/hawthorne?access_token=email:token&access_token=email:token"

// bridgeinfo uses https
var http = require('http');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix
 */
// var authToken= '?access_token=email:token&access_token=email:token'
// var urlPrefix = 'https://api.multco.us/bridges/'
var urlPrefix = 'https://www.ipify.org/'


var BridgeScheduleSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
BridgeScheduleSkill.prototype = Object.create(AlexaSkill.prototype);
BridgeScheduleSkill.prototype.constructor = BridgeScheduleSkill;

BridgeScheduleSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("BridgeScheduleSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

BridgeScheduleSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("BridgeScheduleSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

BridgeScheduleSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

BridgeScheduleSkill.prototype.intentHandlers = {

    "GetBridgeInfoIntent": function (intent, session, response) {
        handleBridgeInfoIntentRequest(intent, session, response);
    },
    "GetVersionIntent": function (intent, session, response) {
        handleVersionIntentRequest(intent, session, response);
    },
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With bridge schedules, you can get information about the bridge." +
            "For example, you can ask 'What is the burnside bridge schedule?'";
        var repromptText = "Do you need another schedule?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var cardTitle = "Bridge Schedule";
    var repromptText = "Which bridge would you like me to check?";
    var speechText = "Which bridge would you like me to check?";
    var cardOutput = "";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleVersionIntentRequest(intent, session, response) {

    var prefixContent = "";
    var cardContent = "";
    var cardTitle = "";

    var speechOutput = {
        speech: "<speak>I am version zero dot zero dot zero</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: "Do you want to hear the version again?",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.tellWithCard(speechOutput, cardTitle, cardContent);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleBridgeInfoIntentRequest(intent, session, response) {

    if(!intent) {
        errorMessage("it appears the requested bridge is not listed.");
    }

    var bridge=intent.slots.BridgeName.value;

    getBridgeInfo(bridge, function (result) {
        console.log(result);
        var speechText = ''
        if(result.status==='success')  {
          // speechText = result.message;
          speechText = result.ip;
          var cardTitle="Bridge Schedule";
          var speechOutput = {
              speech: "<speak>"+ speechText + "</speak>",
              type: AlexaSkill.speechOutputType.SSML
          };
          response.tellWithCard(speechOutput, cardTitle, speechText);
        }
    });
}



function getBridgeInfo(bridge, eventCallback) {
    // url = urlPrefix + bridge + authToken;
    url = urlPrefix;
    console.log('lookup: ' + url);

    http.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body+=chunk;
        });
        res.on('end', function () {
            try {
                var jsonResult = JSON.parse(body);
                jsonResult.status='success';
                eventCallback( jsonResult );
            }
            catch(err) {
                eventCallback(
                    {
                        status: 'error',
                        message: body
                    }
                )
            }
        })
    }).on('error', function (e) {
        console.log("Got error: ", e);
        errorMessage("fetching the schedule for the " + bridge + " bridge");
    });
}

function errorMessage(errString) {
        var speechText = "I am sorry, there was an error " + errString;
        var speechOutput = {
            speech: "<speak>"+ speechText + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tellWithCard(speechOutput, "Error", speechText);
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new BridgeScheduleSkill();
    skill.execute(event, context);
};
