'use strict';

console.log('AlexaTrendyTweets');

var alexa = require('alexa-app');
var chatskills = require('chatskills');
var readlineSync = require('readline-sync');
var xml2js = require('xml2js').parseString;
var request = require('request');
var deasync = require('deasync');

var twitterConsumerKey = ''; 
var twitterConsumerSec = ''; 
var twitterAccessToken = ''; 
var twitterAccessTokenSec = '';


function getTweetTopic(title) {
        var tweets = null;
        var url = 'https://api.twitter.com/1.1/search/tweets.json?q=' + title;


        var oauth_data = {
                    consumer_key: twitterConsumerKey,
                    consumer_secret: twitterConsumerSec
            , token: twitterAccessToken
            , token_secret: twitterAccessTokenSec
        };

        request.get({ url: url, oauth: oauth_data, json: true }, function (error, response, body) {
            if (!error && response.statusCode == 200)
            {

                tweets = body;

            }       
        });

        // Wait until we have a result from the async call.
        deasync.loopWhile(function () { return !tweets; });

        return tweets;
}

function getTweetsFromStatus(statuses, count) {

    var tweets = new Array(count);
    var newCount = 0;

    for (var i = 0; i < count; i++) {
        if (statuses[i].retweet_count > 1000) {
            tweets[newCount] = statuses[i].text;
            newCount++;
        }
    }


    //count = newCount;
    var trendyTweets = { count: newCount, tweets: tweets }
    return trendyTweets;
}

// Define an alexa-app
//var app = new alexa.app('books');
var app = chatskills.app('AlexaTrendyTweets');

app.launch(function (req, res) {
    res.say('What book would you like to know about? Please say get latest tweets about a topic').reprompt('Please say get latest tweets about').shouldEndSession(false);
});


app.intent('getLatestTweets', {
    'slots': {
        'TweetTopic': 'TITLE'
    },
    'utterances': ['get {the latest| latest |} {tweets about|tweets on| tweets} {-|TweetTopic}' ]
}, function (req, res) {
    var title = req.slot('TweetTopic');
    if (title) {
        var message = '';
               
        // Trim trailing comma and whitespace.
        title = title.replace(/,\s*$/, '');

        var tweets = getTweetTopic(title);
        if (tweets && tweets.search_metadata.count > 0) {

            var tweetCount = tweets.search_metadata.count;
            // Store the tweets in session.

            var trendyTweets = getTweetsFromStatus(tweets.statuses, tweetCount);
            res.session('tweets', trendyTweets);

            // Respond to the user.
            message = 'Ok. I found ' + trendyTweets.count + ' retweeted trending tweets about ' + title;
        }
        else {
            message = "Sorry, I can't seem to find that anything trending about that topic.";
        }
    }
    else {
        message = 'What book would you like to get? Please say get latest tweets, \
followed by the topic.';
    }

    // We have a book in session, so keep the session alive.
    res.say(message).shouldEndSession(false);
}
);

app.intent('readTweet', {
    'slots': {
        'index': 5
    },
    'utterances': ['read {the |} {-|index} {tweet |}']
}, function (req, res) {
    var index = req.slot('index');
    var ndx = Number(index) - 1;

    if (ndx >= 0) {
        var message = '';

        // Trim trailing comma and whitespace.
      
        var trendyTweets = req.session('tweets');
    
        if (trendyTweets.count > ndx) {
            
            // Respond to the user.
            message = trendyTweets.tweets[ndx];
        }
        else {
            message = "Sorry, I can't seem to read that tweet.";
        }
    }
    else {
        message = 'What book would you like to get another topic or tweet? Please say get latest tweets, \
followed by the topic or read 1st tweet.';
    }

    // We have a book in session, so keep the session alive.
    res.say(message).shouldEndSession(false);
}
);

app.intent('AMAZON.CancelIntent', {
    'slots': {},
    'utterances': []
}, function (req, res) {
    res.say('Goodbye.').shouldEndSession(true);
}
);

app.intent('AMAZON.StopIntent', {
    'slots': {},
    'utterances': ['{quit|exit|thanks|bye|thank you}']
}, function (req, res) {
    res.say('Goodbye.').shouldEndSession(true);
}
);


module.exports = app;

chatskills.launch(app);

// Console client.
var text = ' ';
while (text.length > 0 && text != 'quit') {    text = readlineSync.question('> ');

    // Respond to input.
    chatskills.respond(text, function (response) {
        console.log(response);
    });
}