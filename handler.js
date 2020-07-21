'use strict';

var AWS = require("aws-sdk");

var judgeJanken = function (a, b) {
  var c = (a - b + 3) % 3;
  if (c === 0) return "draw";
  if (c === 2) return "win";
  return "lose";
}

var getDynamoClient = function () {
  return new AWS.DynamoDB.DocumentClient();
}

module.exports.playJanken = function (event, context, callback) {
  console.log("Received event:", JSON.stringify(event, null, 2));
  console.log("Received context:", JSON.stringify(context, null, 2));

  var dynamodb    = getDynamoClient();
  var date        = new Date();
  var unixtime    = Math.floor(date.getTime() /1000);

  var hand        = ["rock", "scissors", "paper"];
  var player_name = event.queryStringParameters.name;
  var player_hand = event.queryStringParameters.hand;
  var player      = hand.indexOf(player_hand);
  var computer    = Math.floor( Math.random() * 3) ;
  var judge       = judgeJanken(player, computer);

  var params = {
    TableName: "jankens",
    Item: {
      player: player_name,
      unixtime: unixtime,
      player_hand: player_hand,
      computer_hand: hand[computer],
      judge: judge
    }
  };

  dynamodb.put(params, function(err) {
    var response = {statusCode: null, body: null};
    if (err) {
      console.log(err);
      response.statusCode = 500;
      response.body = {code: 500, message: "PutItem Error"};
    } else {
      response.statusCode = 200;
      response.body = JSON.stringify({
        player: player_hand,
        computer: hand[computer],
        unixtime: unixtime,
        judge: judge
      });
    }
    callback(null, response);
  });
};

module.exports.listJankens = function (event, context, callback) {
  console.log("Received event:", JSON.stringify(event, null, 2));
  console.log("Received context:", JSON.stringify(context, null, 2));

  var dynamodb = getDynamoClient();
  var params   = { TableName: "jankens" };

  dynamodb.scan(params, function(err, data) {
    var response = {statusCode: null, body: null};
    if (err) {
      console.log("err: ", err);
      response.statusCode = 500;
      response.body = {code: 500, message: "ScanItem Error"};
    } else if ("Items" in data) {
      response.statusCode = 200;
      response.body = JSON.stringify({jankens: data["Items"]});
    }
    callback(null, response);
  });
};


module.exports.hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
