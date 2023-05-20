type Position = [number, number];
type Direction = 'up' | 'down' | 'left' | 'right';
type State = 'playing' | 'paused' | 'gameover';

const ctx = Switch.screen.getContext('2d');

// TODO: move these to `nxjs-constants`(?) module
const HidNpadButton_A = 1 << 0; ///< A button / Right face button
const HidNpadButton_Plus = 1 << 10; ///< Plus button
const HidNpadButton_Left = 1 << 12; ///< D-Pad Left button
const HidNpadButton_Up = 1 << 13; ///< D-Pad Up button
const HidNpadButton_Right = 1 << 14; ///< D-Pad Right button
const HidNpadButton_Down = 1 << 15; ///< D-Pad Down button

const snakeBody: Position[] = [];
const gridSize = 16;
const boardWidth = 76;
const boardHeight = 40;
const boardX = Switch.screen.width / 2 - (boardWidth * gridSize) / 2;
const boardY = Switch.screen.height / 2 - (boardHeight * gridSize) / 2;
let food: Position = [0, 0];
let direction: Direction = 'right';
let interval: number = 0;
let state: State;

function start() {
	makeFood();
	snakeBody.length = 0;
	snakeBody.push([5, 5], [6, 5], [7, 5]);
	direction = 'right';
	play();
}

function restart() {
	pause();
	start();
}

function pause() {
	state = 'paused';
	clearInterval(interval);
}

function play() {
	state = 'playing';
	interval = setInterval(update, 100);
	draw();
}

function draw() {
	// Reset board
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, Switch.screen.width, Switch.screen.height);

	// Draw border
	// TODO: use `strokeRect()` instead
	ctx.fillStyle = 'white';
	ctx.fillRect(
		boardX - 1,
		boardY - 1,
		boardWidth * gridSize + 2,
		boardHeight * gridSize + 2
	);
	ctx.fillStyle = 'rgb(0, 0, 70)';
	ctx.fillRect(boardX, boardY, boardWidth * gridSize, boardHeight * gridSize);

	// Draw food
	ctx.fillStyle = 'green';
	ctx.fillRect(
		boardX + food[0] * gridSize,
		boardY + food[1] * gridSize,
		gridSize,
		gridSize
	);

	// Draw snake
	ctx.fillStyle = 'red';
	for (const [x, y] of snakeBody) {
		ctx.fillRect(
			boardX + x * gridSize,
			boardY + y * gridSize,
			gridSize,
			gridSize
		);
	}

	// Debugging
	ctx.fillStyle = 'white';
	ctx.font = '16px system-ui';
	ctx.fillText(`Direction: ${direction}`, 10, Switch.screen.height - 10);
}

function update() {
	// Move snake
	const oldHead = snakeBody[snakeBody.length - 1];
	const head: Position = [oldHead[0], oldHead[1]];
	if (direction === 'up') {
		head[1]--;
	} else if (direction === 'down') {
		head[1]++;
	} else if (direction === 'left') {
		head[0]--;
	} else if (direction === 'right') {
		head[0]++;
	}

	// if `head` is past the edge, or within the snake body - game over
	if (
		head[0] < 0 ||
		head[1] < 0 ||
		head[0] >= boardWidth ||
		head[1] >= boardHeight ||
		isWithinSnake(head)
	) {
		gameOver();
		return;
	}

	snakeBody.push(head);

	// if `head` matches the food position, then eat it
	if (head[0] === food[0] && head[1] === food[1]) {
		makeFood();
	} else {
		snakeBody.shift();
	}

	draw();
}

function isWithinSnake(pos: Position) {
	return snakeBody.some(
		(snakePos) => pos[0] === snakePos[0] && pos[1] === snakePos[1]
	);
}

function makeFood(): void {
	food = [
		Math.floor(Math.random() * boardWidth),
		Math.floor(Math.random() * boardHeight),
	];
	if (isWithinSnake(food)) {
		// Inside of snake body, so try again
		makeFood();
	}
}

function gameOver() {
	clearInterval(interval);
	state = 'gameover';
	const score = snakeBody.length - 3;
	ctx.fillStyle = 'white';
	ctx.fillText('Game Over. Your score was ' + score, 40, 40);
}

Switch.addEventListener('buttondown', (event) => {
	if (state === 'playing') {
		if (event.detail & HidNpadButton_Left) {
			if (direction !== 'right') {
				direction = 'left';
			}
		} else if (event.detail & HidNpadButton_Up) {
			if (direction !== 'down') {
				direction = 'up';
			}
		} else if (event.detail & HidNpadButton_Right) {
			if (direction !== 'left') {
				direction = 'right';
			}
		} else if (event.detail & HidNpadButton_Down) {
			if (direction !== 'up') {
				direction = 'down';
			}
		} else if (event.detail & HidNpadButton_Plus) {
			event.preventDefault();
			pause();
		}
	} else if (state === 'paused') {
		if (event.detail & HidNpadButton_Plus) {
			event.preventDefault();
			play();
		}
	} else if (state === 'gameover') {
		if (event.detail & HidNpadButton_A) {
			start();
		}
	}
});

start();
