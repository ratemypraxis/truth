const express = require('express');
const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

const app = express();

const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({ server: httpsServer });

const httpServer = http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
});

const uniqueVisitors = new Set();
const buttonClicks = new Set();
const videoThreshold = 3;
const videoUrl = process.env.VIDEO_URL; 
let isVideoUnlocked = false;

app.use(express.static('public'));

wss.on('connection', (ws) => {
    const ip = ws._socket.remoteAddress;
    uniqueVisitors.add(ip);
    console.log(`new friend ${ip}. total friends: ${uniqueVisitors.size}`);

    // Check if the video is unlocked
    if (isVideoUnlocked) {
        // Redirect existing users to the video URL
        ws.send(JSON.stringify({ action: 'redirectToVideo', videoUrl }));
    }

    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        console.log(`Received message: ${JSON.stringify(msg)}`);

        if (msg.action === 'verifyPassword') {
            if (msg.password === 'special') {
                buttonClicks.add(ip);
                const count = buttonClicks.size;

                console.log(`Password verified for ${ip}. Total clicks: ${count}`);
                ws.send(JSON.stringify({ action: 'passwordVerified', count }));

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ action: 'updateCount', count }));
                    }
                });

                if (count >= videoThreshold && !isVideoUnlocked) {
                    isVideoUnlocked = true; 
                    console.log(`Video unlocked for all users.`);
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ action: 'redirectToVideo', videoUrl }));
                        }
                    });
                }
            } else {
                console.log(`wrong pass ${ip}`);
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
});


httpsServer.listen(443, () => {
    console.log('HTTPS server is listening on port 443');
});

httpServer.listen(80, () => {
    console.log('HTTP server is listening on port 80 and redirecting to HTTPS');
});
