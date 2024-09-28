const button = document.getElementById('presentButton');
const message = document.getElementById('message');
const countSpan = document.getElementById('count');
let player;
let videoReady = false; // Track if video is ready

function onYouTubeIframeAPIReady(videoUrl) {
    const videoId = videoUrl.split('v=')[1].split('&')[0]; // Extract video ID from URL
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'autoplay': 1,
            'mute': 0,
        },
        events: {
            'onReady': (event) => {
                videoReady = true; // Mark video as ready
                event.target.pauseVideo(); // Start paused
            },
            'onStateChange': (event) => {
                if (event.data === YT.PlayerState.ENDED) {
                    player.pauseVideo(); // Pause when video ends
                }
            }
        }
    });
}

const ws = new WebSocket(`ws://${window.location.host}`);

button.addEventListener('click', () => {
    ws.send(JSON.stringify({ action: 'logClick' }));
    button.style.display = 'none'; // Hide the button after clicking
});

ws.onmessage = (event) => {
    const messageData = JSON.parse(event.data);
    if (messageData.action === 'updateCount') {
        countSpan.textContent = messageData.count;
        message.style.display = 'block'; // Show user count message
    } else if (messageData.action === 'playVideo') {
        message.style.display = 'none'; // Hide the message when video starts
        document.getElementById('player').style.display = 'block';

        if (videoReady) {
            player.playVideo(); // Autoplay if video is already ready
        } else {
            onYouTubeIframeAPIReady(messageData.videoUrl); // Initialize if not ready
        }
    }
};

// Load YouTube API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.body.appendChild(tag);
