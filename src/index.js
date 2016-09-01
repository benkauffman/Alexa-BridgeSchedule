// bridge icon from http://www.flaticon.com/free-icon/bridge_183375

var fs = require('fs');
var credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
console.log('api_key: %s', credentials.access_token);

/**
 * App ID for the skill
 */
var APP_ID = null; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';
// curl -X GET --header "Accept: application/json" "https://api.multco.us/bridges/hawthorne?access_token=email:token&access_token=email:token"

// bridgeinfo uses https
var http = require('https');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix
 */
var authToken= '?access_token=' + credentials.access_token;
var urlPrefix = 'https://api.multco.us/bridges/';


var BridgeScheduleSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
BridgeScheduleSkill.prototype = Object.create(AlexaSkill.prototype);
BridgeScheduleSkill.prototype.constructor = BridgeScheduleSkill;

BridgeScheduleSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("BridgeScheduleSkill onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

BridgeScheduleSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("BridgeScheduleSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

BridgeScheduleSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);

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
        var speechText = "With multnomah county bridge schedules, you can get information about the bridge." +
            "For example, you can ask 'What is the burnside bridge schedule?' or 'Is the broadway bridge up?'";
        var repromptText = "Would you like to check another bridge?";
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

    if(!validateBridge(intent)){
      return;
    }

    var millis = new Date().getTime();

    var bridge=intent.slots.BridgeName.value;

    getBridgeInfo(bridge, function (result) {
        console.log(result);
        var speechText = '';
        if(result.status==='success')  {
          // speechText = result.message;
          if(jsonResult.body.length <= 0){
          speechText = "There are currently no scheduled events for the " + bridge + " bridge.";
        }else{
          speechText = "There are currently " + jsonResult.body.length + " scheduled events for the " + bridge + " bridge.";  
        }

          var cardTitle="Bridge Schedule";
          var speechOutput = {
              speech: "<speak>"+ speechText + "</speak>",
              type: AlexaSkill.speechOutputType.SSML
          };
          response.tellWithCard(speechOutput, cardTitle, speechText);
        }
    });
}

function validateBridge(intent){
  bridges = ["hawthorne","morrison","burnside","broadway"];

  if(!intent || bridges.indexOf(intent.slots.BridgeName.value.toLowerCase()) <= -1) {
      errorMessage("it appears the requested bridge is not listed. You can ask about the hawthorne, morrison, burnside or broadway bridge.");
      return;
  }
}

function getBridgeInfo(bridge, eventCallback, apiResource) {

  if(bridge){
    url = urlPrefix + '\\' + bridge + authToken;
  }else{
  url = urlPrefix + authToken;
  }
    console.log('lookup: ' + url);

    http.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body+=chunk;
        });
        res.on('end', function () {
            try {
                var jsonResult.body = JSON.parse(body);
                jsonResult.status='success';
                eventCallback( jsonResult );
            }
            catch(err) {
                eventCallback(
                    {
                        status: 'error',
                        message: body
                    }
                );
            }
        });
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
