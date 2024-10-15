const enterButton = document.getElementById('enterButton');
const passwordInput = document.getElementById('passwordInput');
const message = document.getElementById('message');
const countSpan = document.getElementById('count');
const inputGroup = document.getElementById('inputGroup');

//change to wss connection if https upgrade (reccomend it) and to hosted domain - do not need port num if 80 or 443
const ws = new WebSocket('ws://localhost:3000'); 

ws.onopen = () => {
    console.log('Connected to WebSocket');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event);
};

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.action === 'redirectToVideo') {
        console.log('Redirecting to video...');
        window.location.href = msg.videoUrl; 
    } else if (msg.action === 'showMessage') {
        message.textContent = msg.message;
        message.style.display = 'block';
        inputGroup.style.display = 'none'; 
    } else if (msg.action === 'passwordDenied') {
        message.textContent = 'Nice try...';
        message.style.display = 'block';
    } else if (msg.action === 'updateCount') {
        countSpan.textContent = msg.count;
    } else if (msg.action === 'hideInput') {
        inputGroup.style.display = 'none';
    }
};

const sendPassword = () => {
    const password = passwordInput.value.trim();
    ws.send(JSON.stringify({ action: 'verifyPassword', password }));
};

enterButton.addEventListener('click', sendPassword);
enterButton.addEventListener('touchstart', sendPassword);
