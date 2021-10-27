const AWS = require('aws-sdk');
var redirectToStepFunctions = function(lambdaArn, statemachineName, executionName, callback) {
  const lambdaArnTokens = lambdaArn.split(":");
  const partition = lambdaArnTokens[1];
  const region = lambdaArnTokens[3];
  const accountId = lambdaArnTokens[4];

  console.log("partition=" + partition);
  console.log("region=" + region);
  console.log("accountId=" + accountId);

  const executionArn = "arn:" + partition + ":states:" + region + ":" + accountId + ":execution:" + statemachineName + ":" + executionName;
  console.log("executionArn=" + executionArn);

  const url = "https://console.aws.amazon.com/states/home?region=" + region + "#/executions/details/" + executionArn;
  callback(null, {
      statusCode: 302,
      headers: {
        Location: url
      }
  });
};

exports.handler = (event, context, callback) => {
  console.log('Event= ' + JSON.stringify(event));
  const action = event.query.action;
  const taskToken = event.query.taskToken;
  const statemachineName = event.query.sm;
  const executionName = event.query.ex;
  const articleSlug = event.query.slug;

  const stepfunctions = new AWS.StepFunctions();

  var message = "";

  if (action === "approve") {
    message = { "Status": "Approved!", "articleSlug": articleSlug };
  } else if (action === "reject") {
    message = { "Status": "Rejected!", "articleSlug": articleSlug };
  } else {
    console.error("Unrecognized action. Expected: approve, reject.");
    callback({"Status": "Failed to process the request. Unrecognized Action."});
  }

  stepfunctions.sendTaskSuccess({
    output: JSON.stringify(message),
    taskToken: event.query.taskToken
  })
  .promise()
  .then(function(data) {
    redirectToStepFunctions(context.invokedFunctionArn, statemachineName, executionName, callback);
  }).catch(function(err) {
    console.error(err, err.stack);
    callback(err);
  });
}
