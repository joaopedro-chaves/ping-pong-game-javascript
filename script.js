// Pong Game by Code Explained

// Get the canvas element and its 2D context
const canvas = document.getElementById("pong");
const ctx = canvas.getContext('2d');

// Load audio files for game sounds
let hit = new Audio();
let wall = new Audio();
let scorePoint = new Audio();

// Set the source for each audio file
hit.src = "assets/hit.mp3";
wall.src = "assets/wall.mp3";
scorePoint.src = "assets/scorePoint.mp3";

// Initialize variables for game state
let controllerIndex = null;
let upPressed = false;
let downPressed = false;
const PADDLE_SPEED = 8;

// Define the ball object with its properties
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: "WHITE"
}

// Define the user paddle object with its properties
const user = {
    x: 0,
    y: (canvas.height - 100) / 2,
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

// Define the computer paddle object with its properties
const com = {
    x: canvas.width - 10,
    y: (canvas.height - 100) / 2,
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

// Define the net object with its properties
const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    width: 10,
    height: 10,
    color: "#818181ff"
}

// Function to draw a rectangle on the canvas
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// Function to draw the ball on the canvas
function drawBall(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 10, 10);
}

// Add event listener for mouse movement to control the user paddle
canvas.addEventListener("mousemove", getMousePos);

// Function to get the mouse position and update the user paddle's y-coordinate
function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();
    user.y = evt.clientY - rect.top - user.height / 2;
}

// Add event listeners for touch movement to control the user paddle
canvas.addEventListener("touchmove", getTouchPos, { passive: false });
canvas.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });

// Function to get the touch position and update the user paddle's y-coordinate
function getTouchPos(evt) {
    if (evt.cancelable) evt.preventDefault();

    let rect = canvas.getBoundingClientRect();
    let touch = evt.touches[0];

    user.y = touch.clientY - rect.top - user.height / 2;
}

// Add event listeners for gamepad connection and disconnection
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

// Function to handle controller input and update the user paddle's position
function controllerInput() {
    // Try to find a connected gamepad
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    if (controllerIndex === null && gamepads.length > 0) {
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                controllerIndex = i;
                console.log("✓ Gamepad conectado - Índice:", i, "- ID:", gamepads[i].id);
                break;
            }
        }
    }

    if (controllerIndex === null || !gamepads[controllerIndex]) {
        return;
    }

    const gamepad = gamepads[controllerIndex];
    
    // If the game is over, check if any button is pressed to restart
    if (gameOver) {
        const buttons = gamepad.buttons;
        if (buttons && buttons.some(btn => btn && btn.pressed)) {
            console.log("✓ Botão pressionado - Reiniciando jogo");
            restartGame();
        }
        return;
    }
    
    const buttons = gamepad.buttons;
    const axes = gamepad.axes;
    const stickDeadZone = 0.3;
    
    let moveY = 0;

    // Verificar eixo analógico esquerdo (Y-axis) - primária
    if (axes.length > 1 && Math.abs(axes[1]) > stickDeadZone) {
        moveY = axes[1] * PADDLE_SPEED;
        console.log("Stick Y:", axes[1].toFixed(2));
    }
    // Fallback para D-Pad (buttons 12 e 13)
    else if (buttons.length > 13) {
        if (buttons[12] && buttons[12].pressed) {
            moveY = -PADDLE_SPEED;
            console.log("D-Pad UP");
        } else if (buttons[13] && buttons[13].pressed) {
            moveY = PADDLE_SPEED;
            console.log("D-Pad DOWN");
        }
    }
    // Fallback para botões de trigger (alternativos)
    else if (buttons.length > 6) {
        if (axes.length > 3) {
            // Usar triggers analógicos se disponíveis
            const leftTrigger = axes[2] || 0;
            const rightTrigger = axes[3] || 0;
            
            if (leftTrigger > stickDeadZone) {
                moveY = -PADDLE_SPEED;
            } else if (rightTrigger > stickDeadZone) {
                moveY = PADDLE_SPEED;
            }
        }
    }

    // Aplicar movimento
    user.y += moveY;

    // Manter paddle dentro dos limites
    if (user.y < 0) {
        user.y = 0;
    } else if (user.y > canvas.height - user.height) {
        user.y = canvas.height - user.height;
    }
}

// Function to reset the ball to the center and reverse its direction
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

// Function to draw the net on the canvas
function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// Function to draw text on the canvas
function drawText(text, x, y) {
    ctx.fillStyle = "#FFF";
    ctx.font = "70px 'Silkscreen'";
    ctx.fillText(text, x, y);
}

// Function to check for collision between the ball and a paddle
function collision(b, p) {
    // Calculate the edges of the paddle and the ball
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

// Variable to track if the game is over
let gameOver = false;

// Function to update the game state, including ball movement and collision detection
function update() {
    if (gameOver) return;

    if (ball.x - ball.radius < 0) {
        com.score++;
        scorePoint.play().catch(() => {});
        if (com.score === 11) {
            gameOver = true;
        } else {
            resetBall();
        }
    } else if (ball.x + ball.radius > canvas.width) {
        user.score++;
        scorePoint.play().catch(() => {});
        if (user.score === 11) {
            gameOver = true;
        } else {
            resetBall();
        }
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Simple AI for the computer paddle to follow the ball's y-coordinate
    let computerSpeed = 2.8;
    let computerCenter = com.y + com.height / 2;

    if (computerCenter < ball.y - 10) {
        com.y += computerSpeed;
    } else if (computerCenter > ball.y + 10) {
        com.y -= computerSpeed;
    }

    // Ensure the computer paddle stays within the canvas boundaries
    if (com.y < 0) {
        com.y = 0;
    } else if (com.y + com.height > canvas.height) {
        com.y = canvas.height - com.height;
    }

    // Ensure the ball stays within the canvas boundaries and bounces off the top and bottom walls
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.velocityY = -ball.velocityY;
        wall.play().catch(() => {});
    } else if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.velocityY = -ball.velocityY;
        wall.play().catch(() => {});
    }

    let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

    if (collision(ball, player)) {
        hit.play().catch(() => {});
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

// Function to render the game elements on the canvas
function render() {
    drawRect(0, 0, canvas.width, canvas.height, "#000");

    // Show scores with a blinking effect when the game is over
    let showScore = true;
    if (gameOver) {
        showScore = Math.floor(Date.now() / 500) % 2 === 0;
    }

    if (showScore) {
        drawText(user.score, canvas.width / 4, canvas.height / 5);
        drawText(com.score, 3 * canvas.width / 4, canvas.height / 5);
    }

    drawNet();
    drawRect(user.x, user.y, user.width, user.height, user.color);
    drawRect(com.x, com.y, com.width, com.height, com.color);
    drawBall(ball.x, ball.y, ball.color);

    // Display the game over message when the game is over
    if (gameOver) {
        ctx.fillStyle = "#FFF";
        ctx.font = "30px 'Silkscreen'";
        let msg = user.score === 11 ? "PLAYER WIN!" : "COM WIN!";
        ctx.fillText(msg, canvas.width / 2 - 150, canvas.height / 2 + 50);
    }
}

// Function to restart the game by resetting scores and ball position
function restartGame() {
    user.score = 0;
    com.score = 0;
    gameOver = false;
    setTimeout(resetBall, 1200);
}

// Add event listeners for mouse and touch input to restart the game when it's over
canvas.addEventListener("mousedown", () => {
    if (gameOver) restartGame();
});

canvas.addEventListener("touchstart", () => {
    if (gameOver) restartGame();
});

// Main game loop to update and render the game at a fixed frame rate
function game() {
    controllerInput();
    update();
    render();
}

// Set the desired frames per second and start the game loop
let framesPerSecond = 50;
let loop = setInterval(game, 1000 / framesPerSecond);