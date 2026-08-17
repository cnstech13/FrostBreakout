const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


/* =========================
   ELEMENTS
========================= */

const scoreDisplay =
    document.getElementById("score");

const levelDisplay =
    document.getElementById("level");

const highScoreDisplay =
    document.getElementById("highScore");

const livesDisplay =
    document.getElementById("lives");

const pauseBtn =
    document.getElementById("pauseBtn");

const startScreen =
    document.getElementById("startScreen");

const pauseScreen =
    document.getElementById("pauseScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const levelScreen =
    document.getElementById("levelScreen");

const startBtn =
    document.getElementById("startBtn");

const resumeBtn =
    document.getElementById("resumeBtn");

const restartBtn =
    document.getElementById("restartBtn");

const restartPauseBtn =
    document.getElementById(
        "restartPauseBtn"
    );

const nextBtn =
    document.getElementById("nextBtn");

const finalScore =
    document.getElementById("finalScore");

const finalBest =
    document.getElementById("finalBest");

const nextLevel =
    document.getElementById("nextLevel");


/* =========================
   CANVAS
========================= */

let W = 0;
let H = 0;

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    W = rect.width;
    H = rect.height;

    const ratio =
        window.devicePixelRatio || 1;

    canvas.width =
        W * ratio;

    canvas.height =
        H * ratio;

    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    if (paddle) {

        paddle.y =
            H - 40;

        keepPaddleInside();
    }
}

window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================
   GAME STATE
========================= */

let score = 0;

let level = 1;

let lives = 3;

let highScore =
    Number(
        localStorage.getItem(
            "frostBreakoutHighScore"
        )
    ) || 0;

let running = false;

let paused = false;

let waitingForNextLevel = false;

let screenShake = 0;


/* =========================
   PADDLE
========================= */

const paddle = {

    width: 65,

    height: 9,

    x: 0,

    y: 0,

    speed: 9
};


/* =========================
   BALL
========================= */

const ball = {

    x: 0,

    y: 0,

    radius: 6,

    dx: 4,

    dy: -5,

    trail: []
};


/* =========================
   BRICKS
========================= */

let bricks = [];

const brickRows = 4;

const brickCols = 7;


function createBricks() {

    bricks = [];

    const gap = 4;

    const margin = 12;

    const top = 110;

    const brickWidth =
        (
            W -
            margin * 2 -
            gap *
            (brickCols - 1)
        ) / brickCols;

    const brickHeight = 23;


    for (
        let row = 0;
        row < brickRows;
        row++
    ) {

        for (
            let col = 0;
            col < brickCols;
            col++
        ) {

            /*
                Creates the irregular
                brick arrangement.
            */

            if (
                row === 2 &&
                col === 0
            ) continue;

            if (
                row === 2 &&
                col === 6
            ) continue;

            if (
                row === 3 &&
                col > 4
            ) continue;


            bricks.push({

                x:
                    margin +
                    col *
                    (brickWidth + gap),

                y:
                    top +
                    row *
                    (brickHeight + gap),

                width:
                    brickWidth,

                height:
                    brickHeight,

                alive: true,

                hits:
                    row === 3 ? 2 : 1,

                maxHits:
                    row === 3 ? 2 : 1,

                color:
                    row % 2 === 0
                    ? "#008cff"
                    : "#0055ff"
            });
        }
    }
}


/* =========================
   RESET BALL
========================= */

function resetBall() {

    paddle.x =
        W / 2 -
        paddle.width / 2;

    paddle.y =
        H - 40;


    ball.x =
        W / 2;

    ball.y =
        H - 65;


    const speed =
        4.5 +
        (level - 1) * 0.45;


    ball.dx =
        (
            Math.random() > .5
            ? 1
            : -1
        ) * speed;


    ball.dy =
        -speed;


    ball.trail = [];
}


/* =========================
   HUD
========================= */

function updateHUD() {

    scoreDisplay.textContent =
        String(score)
            .padStart(6, "0");

    levelDisplay.textContent =
        level;

    highScoreDisplay.textContent =
        String(highScore)
            .padStart(6, "0");

    livesDisplay.textContent =
        lives;
}


/* =========================
   HIGH SCORE
========================= */

function saveHighScore() {

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "frostBreakoutHighScore",
            highScore
        );
    }
}


/* =========================
   AUDIO
========================= */

let audioContext = null;


function initAudio() {

    if (!audioContext) {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (AudioContext) {

            audioContext =
                new AudioContext();
        }
    }

    if (
        audioContext &&
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


function playSound(
    frequency,
    duration = .08,
    type = "sine"
) {

    if (!audioContext)
        return;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.type = type;

    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        .08,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audioContext.currentTime +
        duration
    );


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
        audioContext.currentTime +
        duration
    );
}


/* =========================
   VIBRATION
========================= */

function vibrate(pattern) {

    if (
        navigator.vibrate
    ) {

        navigator.vibrate(pattern);
    }
}


/* =========================
   BACKGROUND
========================= */

function drawBackground() {

    ctx.fillStyle =
        "#00030d";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            10,
            W / 2,
            H / 2,
            H * .7
        );


    gradient.addColorStop(
        0,
        "rgba(0,80,180,.18)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );


    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}


/* =========================
   SNOW
========================= */

let snow = [];


function createSnow() {

    snow = [];

    for (
        let i = 0;
        i < 55;
        i++
    ) {

        snow.push({

            x:
                Math.random() * W,

            y:
                Math.random() * H,

            size:
                Math.random() * 2 + .5,

            speed:
                Math.random() * .5 + .15
        });
    }
}


function drawSnow() {

    for (const s of snow) {

        s.y += s.speed;

        s.x +=
            Math.sin(
                Date.now() * .001 +
                s.y
            ) * .03;


        if (s.y > H) {

            s.y = -5;

            s.x =
                Math.random() * W;
        }


        ctx.fillStyle =
            "rgba(190,235,255,.55)";


        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            s.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =========================
   DRAW BRICKS
========================= */

function drawBricks() {

    for (const brick of bricks) {

        if (!brick.alive)
            continue;


        ctx.shadowBlur = 14;

        ctx.shadowColor =
            brick.color;


        const gradient =
            ctx.createLinearGradient(
                brick.x,
                brick.y,
                brick.x,
                brick.y +
                brick.height
            );


        gradient.addColorStop(
            0,
            "#7ce7ff"
        );

        gradient.addColorStop(
            .45,
            brick.color
        );

        gradient.addColorStop(
            1,
            "#002fa8"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            brick.height
        );


        /*
            Ice highlight
        */

        ctx.shadowBlur = 0;

        ctx.fillStyle =
            "rgba(255,255,255,.3)";


        ctx.fillRect(
            brick.x,
            brick.y,
            brick.width,
            3
        );


        /*
            Damaged brick
        */

        if (
            brick.hits <
            brick.maxHits
        ) {

            ctx.fillStyle =
                "rgba(0,0,40,.35)";

            ctx.fillRect(
                brick.x + 5,
                brick.y + 7,
                brick.width - 10,
                2
            );
        }
    }

    ctx.shadowBlur = 0;
}


/* =========================
   DRAW PADDLE
========================= */

function drawPaddle() {

    const gradient =
        ctx.createLinearGradient(
            paddle.x,
            paddle.y,
            paddle.x,
            paddle.y +
            paddle.height
        );


    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        .35,
        "#35dcff"
    );

    gradient.addColorStop(
        1,
        "#006cff"
    );


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#00bfff";


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        paddle.x,
        paddle.y,
        paddle.width,
        paddle.height
    );


    ctx.shadowBlur = 0;
}


/* =========================
   DRAW BALL
========================= */

function drawBall() {

    for (
        let i = 0;
        i < ball.trail.length;
        i++
    ) {

        const t =
            ball.trail[i];

        const alpha =
            i /
            ball.trail.length *
            .5;


        ctx.beginPath();

        ctx.arc(
            t.x,
            t.y,
            ball.radius *
            (
                i /
                ball.trail.length
            ),
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            `rgba(
                0,
                190,
                255,
                ${alpha}
            )`;

        ctx.fill();
    }


    ctx.shadowBlur = 30;

    ctx.shadowColor =
        "#00d9ff";


    const gradient =
        ctx.createRadialGradient(
            ball.x - 2,
            ball.y - 2,
            1,
            ball.x,
            ball.y,
            ball.radius
        );


    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        .45,
        "#80efff"
    );

    gradient.addColorStop(
        1,
        "#008cff"
    );


    ctx.fillStyle =
        gradient;


    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;
}


/* =========================
   PARTICLES
========================= */

let particles = [];


function createExplosion(x, y) {

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        particles.push({

            x: x,

            y: y,

            dx:
                (
                    Math.random() -
                    .5
                ) * 6,

            dy:
                (
                    Math.random() -
                    .5
                ) * 6,

            life: 1,

            size:
                Math.random() * 3 + 1
        });
    }
}


function drawParticles() {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];


        p.x += p.dx;

        p.y += p.dy;

        p.life -= .035;


        ctx.shadowBlur = 12;

        ctx.shadowColor =
            "#00cfff";


        ctx.fillStyle =
            `rgba(
                80,
                220,
                255,
                ${p.life}
            )`;


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();


        if (
            p.life <= 0
        ) {

            particles.splice(
                i,
                1
            );
        }
    }

    ctx.shadowBlur = 0;
}


/* =========================
   COLLISION
========================= */

function collisionDetection() {

    /*
        BRICKS
    */

    for (const brick of bricks) {

        if (!brick.alive)
            continue;


        if (
            ball.x +
            ball.radius >
            brick.x &&

            ball.x -
            ball.radius <
            brick.x +
            brick.width &&

            ball.y +
            ball.radius >
            brick.y &&

            ball.y -
            ball.radius <
            brick.y +
            brick.height
        ) {

            brick.hits--;

            ball.dy *= -1;

            createExplosion(
                ball.x,
                ball.y
            );

            playSound(
                300 +
                Math.random() * 200,
                .07
            );

            vibrate(20);

            screenShake = 4;


            if (
                brick.hits <= 0
            ) {

                brick.alive = false;

                score +=
                    brick.maxHits === 2
                    ? 25
                    : 10;
            } else {

                score += 5;
            }


            saveHighScore();

            updateHUD();

            break;
        }
    }


    /*
        PADDLE
    */

    if (
        ball.y +
        ball.radius >=
        paddle.y &&

        ball.y -
        ball.radius <=
        paddle.y +
        paddle.height &&

        ball.x >= paddle.x &&

        ball.x <=
        paddle.x +
        paddle.width &&

        ball.dy > 0
    ) {

        const hitPosition =
            (
                ball.x -
                (
                    paddle.x +
                    paddle.width / 2
                )
            ) /
            (paddle.width / 2);


        const speed =
            Math.sqrt(
                ball.dx *
                ball.dx +
                ball.dy *
                ball.dy
            );


        ball.dx =
            hitPosition *
            Math.min(speed, 8);


        ball.dy =
            -Math.sqrt(
                speed * speed -
                ball.dx *
                ball.dx
            );


        ball.y =
            paddle.y -
            ball.radius;


        playSound(
            180,
            .06
        );
    }


    /*
        LEFT
    */

    if (
        ball.x -
        ball.radius <= 0
    ) {

        ball.x =
            ball.radius;

        ball.dx =
            Math.abs(ball.dx);

        playSound(120, .04);
    }


    /*
        RIGHT
    */

    if (
        ball.x +
        ball.radius >= W
    ) {

        ball.x =
            W -
            ball.radius;

        ball.dx =
            -Math.abs(ball.dx);

        playSound(120, .04);
    }


    /*
        TOP
    */

    if (
        ball.y -
        ball.radius <= 0
    ) {

        ball.y =
            ball.radius;

        ball.dy =
            Math.abs(ball.dy);

        playSound(150, .04);
    }


    /*
        BOTTOM
    */

    if (
        ball.y -
        ball.radius > H
    ) {

        loseLife();
    }
}


/* =========================
   LOSE LIFE
========================= */

function loseLife() {

    lives--;

    vibrate([
        80,
        50,
        80
    ]);

    playSound(
        80,
        .25,
        "sawtooth"
    );

    screenShake = 12;

    updateHUD();


    if (lives <= 0) {

        gameOver();

        return;
    }


    resetBall();
}


/* =========================
   CHECK LEVEL
========================= */

function checkLevel() {

    const remaining =
        bricks.filter(
            b => b.alive
        ).length;


    if (
        remaining === 0 &&
        !waitingForNextLevel
    ) {

        waitingForNextLevel =
            true;

        running = false;

        level++;

        score += 100;

        saveHighScore();

        updateHUD();

        nextLevel.textContent =
            level;

        levelScreen.classList.remove(
            "hidden"
        );

        playSound(
            600,
            .15
        );

        setTimeout(
            () => playSound(
                900,
                .2
            ),
            150
        );
    }
}


/* =========================
   START LEVEL
========================= */

function startNextLevel() {

    levelScreen.classList.add(
        "hidden"
    );

    waitingForNextLevel =
        false;

    createBricks();

    resetBall();

    running = true;

    paused = false;

    updateHUD();
}


/* =========================
   UPDATE BALL
========================= */

function updateBall() {

    ball.trail.push({

        x: ball.x,

        y: ball.y
    });


    if (
        ball.trail.length > 13
    ) {

        ball.trail.shift();
    }


    ball.x += ball.dx;

    ball.y += ball.dy;


    collisionDetection();

    checkLevel();
}


/* =========================
   GAME OVER
========================= */

function gameOver() {

    running = false;

    paused = false;

    saveHighScore();

    updateHUD();

    finalScore.textContent =
        String(score)
            .padStart(6, "0");

    finalBest.textContent =
        String(highScore)
            .padStart(6, "0");

    gameOverScreen.classList.remove(
        "hidden"
    );

    playSound(
        70,
        .4,
        "sawtooth"
    );
}


/* =========================
   NEW GAME
========================= */

function newGame() {

    initAudio();

    score = 0;

    level = 1;

    lives = 3;

    running = true;

    paused = false;

    waitingForNextLevel =
        false;

    particles = [];

    gameOverScreen.classList.add(
        "hidden"
    );

    pauseScreen.classList.add(
        "hidden"
    );

    levelScreen.classList.add(
        "hidden"
    );

    createBricks();

    resetBall();

    updateHUD();
}


/* =========================
   PAUSE
========================= */

function togglePause() {

    if (
        !running ||
        waitingForNextLevel
    ) return;


    paused = !paused;


    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );

        pauseBtn.textContent =
            "▶";

    } else {

        pauseScreen.classList.add(
            "hidden"
        );

        pauseBtn.textContent =
            "❚❚";

        initAudio();
    }
}


/* =========================
   PADDLE LIMIT
========================= */

function keepPaddleInside() {

    if (
        paddle.x < 0
    ) {

        paddle.x = 0;
    }


    if (
        paddle.x +
        paddle.width > W
    ) {

        paddle.x =
            W -
            paddle.width;
    }
}


/* =========================
   TOUCH
========================= */

function movePaddle(clientX) {

    const rect =
        canvas.getBoundingClientRect();


    paddle.x =
        clientX -
        rect.left -
        paddle.width / 2;


    keepPaddleInside();
}


canvas.addEventListener(
    "touchstart",
    function(e) {

        e.preventDefault();

        if (!running || paused)
            return;

        movePaddle(
            e.touches[0].clientX
        );

    },
    {
        passive: false
    }
);


canvas.addEventListener(
    "touchmove",
    function(e) {

        e.preventDefault();

        if (!running || paused)
            return;

        movePaddle(
            e.touches[0].clientX
        );

    },
    {
        passive: false
    }
);


/* =========================
   MOUSE
========================= */

canvas.addEventListener(
    "mousemove",
    function(e) {

        if (!running || paused)
            return;

        movePaddle(e.clientX);
    }
);


/* =========================
   KEYBOARD
========================= */

document.addEventListener(
    "keydown",
    function(e) {

        if (
            e.key ===
            "ArrowLeft"
        ) {

            paddle.x -=
                paddle.speed;
        }


        if (
            e.key ===
            "ArrowRight"
        ) {

            paddle.x +=
                paddle.speed;
        }


        if (
            e.key ===
            " "
        ) {

            togglePause();
        }


        keepPaddleInside();
    }
);


/* =========================
   BUTTONS
========================= */

startBtn.addEventListener(
    "click",
    function() {

        startScreen.classList.add(
            "hidden"
        );

        newGame();
    }
);


pauseBtn.addEventListener(
    "click",
    togglePause
);


resumeBtn.addEventListener(
    "click",
    togglePause
);


restartBtn.addEventListener(
    "click",
    newGame
);


restartPauseBtn.addEventListener(
    "click",
    newGame
);


nextBtn.addEventListener(
    "click",
    startNextLevel
);


/* =========================
   GAME LOOP
========================= */

function gameLoop() {

    ctx.save();


    /*
        Screen shake
    */

    if (
        screenShake > 0
    ) {

        ctx.translate(

            (
                Math.random() -
                .5
            ) * screenShake,

            (
                Math.random() -
                .5
            ) * screenShake
        );


        screenShake *= .85;


        if (
            screenShake < .2
        ) {

            screenShake = 0;
        }
    }


    drawBackground();

    drawSnow();

    drawBricks();

    drawParticles();

    drawPaddle();

    drawBall();


    if (
        running &&
        !paused &&
        !waitingForNextLevel
    ) {

        updateBall();
    }


    ctx.restore();


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================
   INITIALIZE
========================= */

resizeCanvas();

createSnow();

createBricks();

resetBall();

updateHUD();

gameLoop();