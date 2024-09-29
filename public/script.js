const enterButton = document.getElementById('enterButton');
const passwordInput = document.getElementById('passwordInput');
const message = document.getElementById('message');
const countSpan = document.getElementById('count');
const inputGroup = document.getElementById('inputGroup');
let player;
let videoReady = false;

//CHANGE HERE IF SERVER CHANGE PLS!!! JUST TO THE DOMAIN 
const ws = new WebSocket('wss://drop.2nd.systems'); 

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
        window.location.href = msg.videoUrl;
    } else if (msg.action === 'passwordVerified') {
        message.textContent = `300-${msg.count} Witnesses Required`;
        message.style.display = 'block';
    } else if (msg.action === 'passwordDenied') {
        message.textContent = 'Nice try...';
        message.style.display = 'block';
    } else if (msg.action === 'updateCount') {
        countSpan.textContent = msg.count;
        if (msg.count >= 3) {
            message.style.display = 'none'; 
        }
    } else if (msg.action === 'hideInput') {
        inputGroup.style.display = 'none'; 
    }
};


const sendPassword = () => {
    const password = passwordInput.value;
    ws.send(JSON.stringify({ action: 'verifyPassword', password }));
};

enterButton.addEventListener('click', sendPassword);
enterButton.addEventListener('touchstart', sendPassword); 

// function onYouTubeIframeAPIReady(videoUrl) {
//     if (!videoUrl) {
//         console.error('Video URL is undefined');
//         return;
//     }
//     const videoId = new URL(videoUrl).searchParams.get('v');
//     player = new YT.Player('player', {
//         height: '100%',
//         width: '100%',
//         videoId: videoId,
//         playerVars: {
//             'playsinline': 1,
//             'controls': 1,
//             'autoplay': 1,
//             'mute': 0,
//         },
//         events: {
//             'onReady': (event) => {
//                 videoReady = true;
//             },
//             'onStateChange': (event) => {
//                 if (event.data === YT.PlayerState.ENDED) {
                    
//                 }
//             }
//         }
//     });
// }

// const tag = document.createElement('script');
// tag.src = 'https://www.youtube.com/iframe_api';
// document.body.appendChild(tag);
