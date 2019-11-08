var ss = SpreadsheetApp.getActiveSpreadsheet();

var sheetConfig = ss.getSheetByName('config');
var sheetUser   = ss.getSheetByName('user');
var sheetLog    = ss.getSheetByName('log');

var numRowUser = sheetUser.getLastRow();

var configLine = getConfig(2);

var LINE_CHANNEL_ACCESS_TOKEN   = configLine.ChannelAccessToken;
var LINE_HEADERS                = {'Content-Type': 'application/json; charset=UTF-8', 'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN,};

/* Other functions */

// To get config JSON
function getConfig(rowIndex){

    return JSON.parse( sheetConfig.getRange(rowIndex, 2).getValue() );

}

// To get a random number
function getRandomNumer(lower, upper){

    return Math.floor(Math.random()*(upper - lower)) + lower;

};

// To get a random numbers
function getRandomNumers(){

    var numberList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    var numbers = [];

    for(var i = 0; i < 4; i++){

        var len = numberList.length;

        var r = getRandomNumer(0, len-1);

        numbers.push( parseInt(numberList[r]) );

        numberList.splice(r, 1);

    }

    return numbers;

};

function getCheckAnswer(numbsers, numbersStr){

    var numbsersInput   = numbersStr.split("");

    var answerObject = { A: 0, B: 0};

    for(var i = 0; i < 4; i++){

        if( numbsers[i] == numbsersInput[i] ){

            answerObject.A++;

        } else {

            var n = numbsersInput[i];

            for(var k = 0; k < 4; k++){

                if(i !== k && n == numbsers[k]){

                    answerObject.B++;

                    break;

                }

            }

        }

    }

    answerObject.A = answerObject.A.toString();
    answerObject.B = answerObject.B.toString();

    return answerObject;

}

// Webhook main function
function doPost(e) {

    var eventObject = JSON.parse(e.postData.contents).events[0];

    var replyToken  = eventObject.replyToken;
    var uid         = eventObject.source.userId;
    var type        = eventObject.type;

    addUser(uid);

    switch(type){

        case 'message':

            var arguments = eventObject.message.text.split(':');

            if(arguments.length > 1){

                var command = arguments[0];

                var subcommand = arguments[1];

                switch(command){

                    case 'game':
                    default:

                        switch(subcommand){

                            case 'start':

                                setGameNumbers(uid)

                                replySimpleMessage(replyToken, "數字已選定，遊戲開始！");

                                break;

                            case 'over':

                                break;

                            case 'status':

                                break;

                            case 'numbers':

                                var numbers = getGameNumbers(uid);

                                var numbersJoin = numbers.join('');

                                replySimpleMessage(replyToken, "數字：" + numbersJoin);

                                break;

                        }

                        break;

                }

            } else {

                var numbersStr = arguments[0];
                var numbers = getGameNumbers(uid);

                var answerObject = getCheckAnswer(numbers, numbersStr);

                replyAnswerMessage(replyToken, numbersStr, answerObject);

            }

            break;

        case 'follow':

            break;

        default:

            break;

    }

}

/* DB functions */

function setGameNumbers(uid){

    clearGameNumbers(uid);

    var userRowIndex = getUserRowIndex(uid);

    var numbers = getRandomNumers();

    sheetUser.getRange(userRowIndex, 3).setValue( JSON.stringify(numbers) );

}

function getGameNumbers(uid){

    var userRowIndex = getUserRowIndex(uid);

    var gameNumbers = JSON.parse( sheetUser.getRange(userRowIndex, 3).getValue() );

    return gameNumbers;

}

function clearGameNumbers(uid){

    var userRowIndex = getUserRowIndex(uid);

    sheetUser.getRange(userRowIndex, 3).setValue("");

}

// To add a uid
function addUser(uid){

    // Check if given uid exist in user sheet

    var ifExist = getUserRowIndex(uid) > 0 ? true : false;

    if(!ifExist){

        sheetUser.appendRow([uid, "", ""]);

    }

}

// To get row index of given uid in user sheet
function getUserRowIndex(uid){

    var rowIndexUser = 0;

    for(var i = 2; i < numRowUser+1; i++){

        var v = sheetUser.getRange(i, 1).getValue();

        if(v === uid){

            rowIndexUser = i;

            break;

        }

    }

    return rowIndexUser;

}

/* LINE reply function*/
// To reply simple text message
function replySimpleMessage(replyToken, message){

    replyMessage(replyToken, [{type:"text",text:message}]);

}

// To reply message
function replyMessage(replyToken, messageList){

    var res = UrlFetchApp.fetch(
		configLine.API.Reply,
		{
			headers: LINE_HEADERS,
			method: 'post',
			payload: JSON.stringify({
				replyToken: replyToken,
				messages: messageList
			})
		}
    );

    sheetLog.appendRow([res.getContentText(), ""]);

}

function replyAnswerMessage(replyToken, numberStr, answerObject){

    var messageList = [
        {
            type: "flex",
            altText: "this is a flex message",
            contents:
                {
                    type: "bubble",
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "md",
                        contents: [
                            {
                                type: "text",
                                text: "您的回答：" + numberStr.split("").join(" "),
                                wrap: true,
                                weight: "bold",
                                gravity: "center",
                                size: "xl"
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                margin: "lg",
                                width: "50%",
                                spacing: "sm",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "baseline",
                                        spacing: "lg",
                                        backgroundColor: "#EEEEEE",
                                        contents: [
                                            {
                                                type: "text",
                                                text: answerObject.A,
                                                color: "#000000",
                                                size: "xl",
                                                align: "center",
                                                flex: 4
                                            },
                                            {
                                                type: "text",
                                                text: "A",
                                                wrap: true,
                                                size: "xl",
                                                color: "#32A84C",
                                                align: "center",
                                                flex: 4
                                            },
                                            {
                                                type: "text",
                                                text: answerObject.B,
                                                wrap: true,
                                                size: "xl",
                                                color: "#000000",
                                                align: "center",
                                                flex: 4
                                            },
                                            {
                                                type: "text",
                                                text: "B",
                                                wrap: true,
                                                size: "xl",
                                                color: "#FF0000",
                                                align: "center",
                                                flex: 4
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }

        }
    ];

    replyMessage(replyToken, messageList);

}