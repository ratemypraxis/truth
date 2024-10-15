const express = require('express');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const uniqueVisitors = new Set();
const buttonClicks = new Set();
//to adjust required number of users on page -- currenlty 300
const videoThreshold = 300; 
const videoUrl = process.env.VIDEO_URL; 
let isVideoUnlocked = false;

console.log(`Loaded password: '${process.env.PASSWORD}'`);

//will unlock and play video at 10.20.24 midnight ET 
//note pls change url for yt video in .env
const dateThreshold = new Date('2024-10-20T04:00:00Z');

app.use(express.static('public'));

wss.on('connection', (ws) => {
    const ip = ws._socket.remoteAddress;
    uniqueVisitors.add(ip);
    console.log(`New connection from ${ip}. Total visitors: ${uniqueVisitors.size}`);

    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        console.log(`Received message: ${JSON.stringify(msg)}`);

        if (msg.action === 'verifyPassword') {
            console.log(`User entered password: '${msg.password}'`);
            console.log(`Expected password: '${process.env.PASSWORD}'`);

            if (msg.password.trim() === process.env.PASSWORD) {
                buttonClicks.add(ip);
                const count = buttonClicks.size;

                console.log(`Password verified for ${ip}. Total clicks: ${count}`);

                if (new Date() < dateThreshold) {
                    ws.send(JSON.stringify({ action: 'showMessage', message: 'The truth demands witnesses. 10 16 24' }));
                }

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ action: 'updateCount', count }));
                    }
                });

                if (new Date() >= dateThreshold && count >= videoThreshold && !isVideoUnlocked) {
                    isVideoUnlocked = true;
                    console.log(`Video unlocked for all users.`);
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ action: 'redirectToVideo', videoUrl }));
                        }
                    });
                }
            } else {
                console.log(`Incorrect password for ${ip}`);
                ws.send(JSON.stringify({ action: 'passwordDenied' }));
            }
        }
    });

    ws.on('close', () => {
        uniqueVisitors.delete(ip);
        buttonClicks.delete(ip);
        console.log(`Connection closed: ${ip}. Total unique visitors: ${uniqueVisitors.size}`);

        const count = buttonClicks.size;
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ action: 'updateCount', count }));
            }
        });
    });

    const initialCount = buttonClicks.size;
    console.log(`Sending initial count of ${initialCount} to ${ip}`);
    ws.send(JSON.stringify({ action: 'updateCount', count: initialCount }));

    const intervalId = setInterval(() => {
        if (new Date() >= dateThreshold && !isVideoUnlocked) {
            isVideoUnlocked = true;
            console.log(`Time threshold reached. Redirecting all users to video.`);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'redirectToVideo', videoUrl }));
                }
            });
            clearInterval(intervalId); 
        }
    }, 1000); 
});

//change port to 80 and/or 443 when deployes
httpServer.listen(3000, () => {
    console.log('HTTP server is listening on port 3000');
});
