const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const uniqueVisitors = new Set();
const buttonClicks = new Set();
const videoThreshold = 2; // Change this to scale up the requirement

// Keep the YouTube URL private
const videoUrl = 'https://www.youtube.com/watch?v=xh1YTnYuNLA&ab_channel=2nd'; // Change this to your unlisted video URL

app.use(express.static('public'));

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;

    // Add unique visitor
    uniqueVisitors.add(ip);
    console.log(`New connection: ${ip}. Unique visitors: ${uniqueVisitors.size}`);

    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        if (msg.action === 'logClick') {
            buttonClicks.add(ip);
            console.log(`Button clicked from: ${ip}. Total clicks: ${buttonClicks.size}`);

            // Notify all clients of the current number of clicks
            const count = buttonClicks.size;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: 'updateCount', count }));
                }
            });

            // Check if we have enough clicks
            if (uniqueVisitors.size === videoThreshold && buttonClicks.size === videoThreshold) {
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ action: 'playVideo', videoUrl }));
                    }
                });
            }
        }
    });

    ws.on('close', () => {
        uniqueVisitors.delete(ip);
        buttonClicks.delete(ip);
        console.log(`Connection closed: ${ip}. Unique visitors: ${uniqueVisitors.size}`);
    });
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
