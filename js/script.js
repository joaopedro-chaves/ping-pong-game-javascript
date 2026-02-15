// Pong Game by Code Explained

//  variables ----------------

const canvas = document.getElementById("pong");
const ctx = canvas.getContext('2d');

// Audio files
let hit = new Audio();
let wall = new Audio();
let scorePoint = new Audio();

hit.src = "assets/hit.mp3";
wall.src = "assets/wall.mp3";
scorePoint.src = "assets/scorePoint.mp3";

// Controller variables
let controllerIndex = null;
let upPressed = false;
let downPressed = false;
const PADDLE_SPEED = 8;
let gameStarted = false;

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: "WHITE"
}

const user = {
    x: 0,
    y: (canvas.height - 100) / 2,
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

const com = {
    x: canvas.width - 10,
    y: (canvas.height - 100) / 2,
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    width: 10,
    height: 10,
    color: "#818181ff"
}

// functions controls ----------------

canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();
    user.y = evt.clientY - rect.top - user.height / 2;
}

canvas.addEventListener("touchmove", getTouchPos, { passive: false });
canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });

function getTouchPos(evt) {
    if (evt.cancelable) evt.preventDefault();

    let rect = canvas.getBoundingClientRect();
    let touch = evt.touches[0];

    user.y = touch.clientY - rect.top - user.height / 2;
}

// Event for gamepad connection
window.addEventListener("gamepadconnected", (event) => {
    controllerIndex = event.gamepad.index;
    console.log("Connected gamepad index:", controllerIndex);
});

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Disconnected gamepad index:", event.gamepad.index);
    if (controllerIndex === event.gamepad.index) {
        controllerIndex = null;
    }
});

function controllerInput() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    if (controllerIndex === null && gamepads.length > 0) {
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                controllerIndex = i;
                console.log("Connected gamepad index: ", i, "- ID:", gamepads[i].id);
                break;
            }
        }
    }

    if (controllerIndex === null || !gamepads[controllerIndex]) {
        return;
    }

    const gamepad = gamepads[controllerIndex];

    if (gameOver) {
        const buttons = gamepad.buttons;
        if (buttons && buttons.some(btn => btn && btn.pressed)) {
            restartGame();
        }
        return;
    }

    if (!gameStarted) {
        const buttons = gamepad.buttons;
        if (buttons && buttons.some(btn => btn && btn.pressed)) {
            startGame();
        }
        return;
    }

    const buttons = gamepad.buttons;
    const axes = gamepad.axes;
    const stickDeadZone = 0.3;

    let moveY = 0;


    if (axes.length > 1 && Math.abs(axes[1]) > stickDeadZone) {
        moveY = axes[1] * PADDLE_SPEED;
    }

    else if (buttons.length > 13) {
        if (buttons[12] && buttons[12].pressed) {
            moveY = -PADDLE_SPEED;
        } else if (buttons[13] && buttons[13].pressed) {
            moveY = PADDLE_SPEED;
        }
    }

    else if (buttons.length > 6) {
        if (axes.length > 3) {
            const leftTrigger = axes[2] || 0;
            const rightTrigger = axes[3] || 0;

            if (leftTrigger > stickDeadZone) {
                moveY = -PADDLE_SPEED;
            } else if (rightTrigger > stickDeadZone) {
                moveY = PADDLE_SPEED;
            }
        }
    }

    if (buttons.length > 3 && buttons[3] && buttons[3].pressed) {
        if (!lastThemeBtnState) {
            switchTheme();
            lastThemeBtnState = true;
        }
    } else {
        lastThemeBtnState = false;
    }

    user.y += moveY;

    if (user.y < 0) {
        user.y = 0;
    } else if (user.y > canvas.height - user.height) {
        user.y = canvas.height - user.height;
    }
}

function keyboardInput() {
    if (upPressed) {
        user.y -= PADDLE_SPEED;
    }
    if (downPressed) {
        user.y += PADDLE_SPEED;
    }

    if (user.y < 0) {
        user.y = 0;
    } else if (user.y > canvas.height - user.height) {
        user.y = canvas.height - user.height;
    }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

function handleKeyDown(evt) {
    const key = evt.key.toUpperCase();
    if (key === "W" || key === "ARROWUP") {
        upPressed = true;
    } else if (key === "S" || key === "ARROWDOWN") {
        downPressed = true;
    } else if (key === "R") {
        switchTheme();
    }

    if (!gameStarted) {
        startGame();
    }
}

function handleKeyUp(evt) {
    const key = evt.key.toUpperCase();
    if (key === "W" || key === "ARROWUP") {
        upPressed = false;
    } else if (key === "S" || key === "ARROWDOWN") {
        downPressed = false;
    }
}

// functions game ----------------

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawBall(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 10, 10);
}

function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

function drawText(text, x, y) {
    ctx.fillStyle = themes[currentThemeIndex].fg;
    ctx.font = "70px 'Silkscreen'";
    ctx.fillText(text, x, y);
}


function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

// Function to check for collision.
function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    // Calculate the edges of the ball
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    // Check if the ball's edges overlap with the paddle's edges. If they do, a collision has occurred.
    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

let gameOver = false;

function update() {
    if (gameOver) return;

    if (ball.x - ball.radius < 0) {
        com.score++;
        scorePoint.play().catch(() => { });
        if (com.score === 11) {
            gameOver = true;
        } else {
            resetBall();
        }
    } else if (ball.x + ball.radius > canvas.width) {
        user.score++;
        scorePoint.play().catch(() => { });
        if (user.score === 11) {
            gameOver = true;
        } else {
            resetBall();
        }
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Simple AI for the computer paddle to follow the ball's y-coordinate
    let computerSpeed = 5.5; // 10 is max speed
    let computerCenter = com.y + com.height / 2;

    if (computerCenter < ball.y - 10) {
        com.y += computerSpeed;
    } else if (computerCenter > ball.y + 10) {
        com.y -= computerSpeed;
    }

    if (com.y < 0) {
        com.y = 0;
    } else if (com.y + com.height > canvas.height) {
        com.y = canvas.height - com.height;
    }

    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.velocityY = -ball.velocityY;
        wall.play().catch(() => { });
    } else if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.velocityY = -ball.velocityY;
        wall.play().catch(() => { });
    }

    let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

    // collision detection
    if (collision(ball, player)) {
        hit.play().catch(() => { });
        let collidePoint = (ball.y - (player.y + player.height / 2));
        collidePoint = collidePoint / (player.height / 2);

        let angleRad = (Math.PI / 4) * collidePoint;

        let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;

        if (direction === 1) {
            ball.x = player.x + player.width + ball.radius;
        } else {
            ball.x = player.x - ball.radius;
        }

        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        ball.speed += 0.1;
    }
}

// Function to render the game elements
function render() {
    drawRect(0, 0, canvas.width, canvas.height, themes[currentThemeIndex].bg);

    let showScore = true;
    if (gameOver) {
        showScore = Math.floor(Date.now() / 500) % 2 === 0;
    }

    if (showScore) {
        drawText(user.score, canvas.width / 4 - 35, canvas.height / 5);
        drawText(com.score, 3 * canvas.width / 4 - 10, canvas.height / 5);
    }

    drawNet();

    drawRect(user.x, user.y, user.width, user.height, user.color);

    drawRect(com.x, com.y, com.width, com.height, com.color);

    drawBall(ball.x, ball.y, ball.color);

    if (gameOver) {
        ctx.fillStyle = themes[currentThemeIndex].fg;
        ctx.font = "30px 'Silkscreen'";
        let msg = user.score === 11 ? "PLAYER WIN!" : "COM WIN!";
        ctx.fillText(msg, canvas.width / 2 - 100, canvas.height / 2);
    }
}

function restartGame() {
    user.score = 0;
    com.score = 0;
    gameOver = false;
    setTimeout(resetBall, 1200);
    console.log("Game restarted");
}

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    const startScreen = document.getElementById("start-screen");
    if (startScreen) {
        startScreen.style.display = "none";
    }
}

canvas.addEventListener("mousedown", () => {
    if (!gameStarted) {
        startGame();
    } else if (gameOver) {
        restartGame();
    }
});

canvas.addEventListener("touchstart", () => {
    if (!gameStarted) {
        startGame();
    } else if (gameOver) {
        restartGame();
    }
});

// Start button listener
document.getElementById("start-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
});

// Theme configuration
const themes = [
    { name: "Classic", bg: "#000000", fg: "#FFFFFF", net: "#5c5c5cff" },
    { name: "Retro Green", bg: "#002b00", fg: "#00ff00", net: "#005500" },
    { name: "Ocean", bg: "#001e3c", fg: "#00ffff", net: "#005577" },
    { name: "Cyberpunk", bg: "#2b002b", fg: "#ff00ff", net: "#770077" },
    { name: "Coffee", bg: "#2b1a0e", fg: "#f2e8dc", net: "#5e3a1f" },
    { name: "Solarized", bg: "#002b36", fg: "#839496", net: "#073642" },
    { name: "Neon", bg: "#000000", fg: "#39FF14", net: "#BC13FE" },
    { name: "P5R", bg: "#e60012", fg: "#000000", net: "#2a0003" },
    { name: "P4G", bg: "#ffe600", fg: "#111111", net: "#e5ce00" },
    { name: "P3R", bg: "#0024ca", fg: "#ffffff", net: "#0055ff" }
];

let currentThemeIndex = 0;
let lastThemeBtnState = false;

function applyTheme() {
    const theme = themes[currentThemeIndex];
    user.color = theme.fg;
    com.color = theme.fg;
    ball.color = theme.fg;
    net.color = theme.net;

    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.fg;
    canvas.style.borderTopColor = theme.fg;
    canvas.style.borderBottomColor = theme.fg;
}

function switchTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme();
    console.log("Switched to theme:", themes[currentThemeIndex].name);
}

window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    switchTheme();
});

canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
        e.preventDefault();
        switchTheme();
    }
}, { passive: false });

/* 
Function to debug win
Use it in the console to debug the game, for example: debugWin("user")
*/

function debugWin(player) {
    if (player === "user") {
        user.score = 11;
    } else {
        com.score = 11;
    }
    gameOver = true;
}

window.debugWin = debugWin;

function game() {
    keyboardInput();
    controllerInput();
    if (gameStarted) {
        update();
    }
    render();
}

// Set the desired frames per second and start the game loop
let framesPerSecond = 50;
let loop = setInterval(game, 1000 / framesPerSecond);
