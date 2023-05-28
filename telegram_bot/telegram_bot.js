var TelegramBot = require('node-telegram-bot-api');
const emojiMap = require('emoji-unicode-map');
const express = require('express');
const http = require('http');

var token = '6011890513:AAGG5yMQ1Gjm3J083A_KVAxwOBW-qmBQ6AI'; //Bot name CNL_Telegram_bot

var bot = new TelegramBot(token, {polling: true});


var last_receive_message = "";



const http_server = express();
const port_rec = 7000;
const port_send = 4000;

bot.on('message', (msg) => {
    
    const chatType = msg.chat.type;
    const messageText = msg.text;
    var gid;
    var uid; 
    
    // Check if the message is from a group
    if (chatType === 'group' || chatType === 'supergroup') {
        gid = msg.chat.id;
    }
    else{
        uid = msg.from.id;
    }

    if (messageText.startsWith('/')) {
    
        // It's a command, handle accordingly
        if (chatType === 'group' || chatType === 'supergroup') {
            
            const [command, ...parameters] = messageText.split(' ');

            // Remove the leading slash from the command
            const formattedCommand = command.slice(1);
            
            if (formattedCommand == "new"){
                //change gid to uid (prevent user call new on group chat)
                gid = msg.from.id
            }
            handleCommand(formattedCommand, parameters, gid);
            
            //handleCommand(messageText, gid);
        }
        else{
            const [command, ...parameters] = messageText.split(' ');

            // Remove the leading slash from the command
            const formattedCommand = command.slice(1);

            handleCommand(formattedCommand, parameters, uid);
            //handleCommand(messageText, uid);
        }
    } 
    else {
        console.log("Sent msg");
        // Send a POST request with JSON data
        const postData = JSON.stringify({
            plat: 'Telegram',
            gid: gid,
            msg: messageText
        });
        
        const options = {
            hostname: 'localhost',
            port: port_send,
            path: '/send',
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
            }
        };

        const postRequest = http.request(options, (res) => {

            

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
        
            res.on('end', () => {
                console.log('Response:', data);
            });

            var resp = "send msg" + ": OK";
            console.log(resp);
            
        });

        postRequest.on('error', (error) => {
            var resp = "send msg" + ": ERROR";
            console.log(resp);
            bot.sendMessage(gid, resp); //發送訊息的function
            
            console.error('Error making POST request:', error);
        });
        
        postRequest.write(postData);
        postRequest.end();
    }
});

function handleCommand(command, parameters, chatId) {
    switch (command) {
        case 'new':
            if (parameters.length > 0) {
                const group_name = parameters.join(' ');
                // Handle /new command with abc parameter
                
                console.log(`Create new ${group_name}`);

                // Send a POST request with JSON data
                const postData = JSON.stringify({
                    plat: 'Telegram',
                    puid: chatId,
                    uid: group_name
                });
                
                const options = {
                    hostname: 'localhost',
                    port: port_send,
                    path: '/new',
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                    }
                };

                const postRequest = http.request(options, (res) => {

                    
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        console.log('Response:', data);
                    });
                    
                    var resp = command + ": OK";
                    console.log(resp);
                    
                });
                
                postRequest.on('error', (error) => {
                    var resp = command + ": ERROR";
                    console.log("Send "+ resp + " to the user.");
                    bot.sendMessage(chatId, resp); //發送訊息的function
                    
                    console.error('Error making POST request:', error);
                });
                
                postRequest.write(postData);
                postRequest.end();
            }
            break;
        case 'chat':
            if (parameters.length > 0) {
                const person = parameters.join(' ');
                // Handle /chat command with person parameter
                console.log(`Start chat with ${person}`);

                // Send a POST request with JSON data
                const postData = JSON.stringify({
                    plat: 'Telegram',
                    gid: chatId,
                    uid: person
                });
                
                const options = {
                    hostname: 'localhost',
                    port: port_send,
                    path: '/chat',
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                    }
                };

                const postRequest = http.request(options, (res) => {

                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        console.log('Response:', data);
                    });
                    
                    var resp = command + ": OK";
                    console.log(resp);
                });

                postRequest.on('error', (error) => {
                    var resp = command + ": ERROR";
                    console.log("Send "+ resp + " to the user.");
                    bot.sendMessage(chatId, resp); //發送訊息的function
                    
                    console.error('Error making POST request:', error);
                });
                
                postRequest.write(postData);
                postRequest.end();
            }
            break;
        
        case 'reply':
            
            console.log("reply");
            const message = last_receive_message;
        
            
            //get msg from
            // Send a POST request with JSON data
            const postData = JSON.stringify({
                msg: message 
            });
            
            const options = {
                hostname: 'localhost',
                port: port_send,
                path: '/reply',
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
                }
            };

            const postRequest = http.request(options, (res) => {

                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
            
                res.on('end', () => {
                    try {
                        const responseData = JSON.parse(data); // Parse the JSON response
                        if (Array.isArray(responseData)) {
                            let response = 'The ChatGPT suggested messages are:\n\n';
                
                            // Iterate through the array and generate the response message
                            responseData.forEach((message, index) => {
                                response += `${index + 1}. ${message}\n`;
                            });
                
                            response += `\nDo you want to choose any of the above options?`;
                
                            const inlineButtons = responseData.map((message, index) => [
                                { text: `Option ${index + 1}`, callback_data: `option_${index + 1}` }
                            ]);
                            inlineButtons.push([{ text: 'Reject all', callback_data: 'reject' }]);
                        
                            // Create the inline keyboard markup
                            const inlineKeyboard = {
                                inline_keyboard: inlineButtons
                            };
                
                            // Send the message with inline keyboard to the user
                            bot.sendMessage(chatId, response, {
                                reply_markup: JSON.stringify(inlineKeyboard)
                            });
                
                            // Callback function to handle the button click
                            bot.on('callback_query', (query) => {
                            const { data } = query;
                            const optionIndex = parseInt(data.split('_')[1]) - 1;
                            if (optionIndex >= 0 && optionIndex < responseData.length) {
                                
                                // Send a POST request with JSON data
                                const postData = JSON.stringify({
                                    plat: 'Telegram',
                                    gid: gid,
                                    msg: responseData[optionIndex]
                                });
                                
                                const options = {
                                    hostname: 'localhost',
                                    port: port_send,
                                    path: '/send',
                                    method: 'POST',
                                    headers: {
                                    'Content-Type': 'application/json',
                                    'Content-Length': postData.length
                                    }
                                };

                                const postRequest = http.request(options, (res) => {


                                    let data = '';
                                    res.on('data', (chunk) => {
                                        data += chunk;
                                    });
                                
                                    res.on('end', () => {
                                        console.log('Response:', data);
                                    });

                                    var resp = "send msg" + ": OK";
                                    console.log(resp);
                                    
                                });

                                postRequest.on('error', (error) => {
                                    var resp = "send msg" + ": ERROR";
                                    console.log("Send "+ resp + " to the user.");
                                    
                                    console.error('Error making POST request:', error);
                                });
                                
                                postRequest.write(postData);
                                postRequest.end();
                            } else if (data === 'reject') {
                                console.log('All options rejected');
                            }
                            });
                        } else {
                            console.log('Invalid response data. Expected an array.');
                        }
                        } catch (error) {
                            console.log('Error parsing the response data:', error);
                        }
                });
                
                
                var resp = command + ": OK";
                console.log(resp);
            });

            postRequest.on('error', (error) => {
                var resp = command + ": ERROR";
                console.log("Send "+ resp + " to the user.");
                bot.sendMessage(chatId, resp); //發送訊息的function
                
                console.error('Error making POST request:', error);
            });
            
            postRequest.write(postData);
            postRequest.end();
            
            break;
        default:
            // Handle other commands
            break;
    }
}

http_server.use(express.json());

http_server.post('/create', (req, res) => {
    console.log("create");

    const receivedData = req.body; // receive JSON data
    
    gid = receivedData.gid

    res.send('Received a POST request'); 
    var resp = "telegram_bot hi";

    bot.sendMessage(gid, resp);
});


http_server.post('/send', (req, res) => {
    console.log("send");
    const receivedData = req.body; // receive JSON data
    gid = receivedData.gid
    msg = receivedData.msg
    res.send('Received a POST request'); 
    var resp = msg;
    last_receive_message = resp;
    bot.sendMessage(gid, resp);
});


http_server.listen(port_rec, () => {
    console.log(`Server is listening on port ${port_rec}`);
});
