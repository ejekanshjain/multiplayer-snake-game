const socket = io('https://snakify5000.herokuapp.com')

const BG_COLOUR = '#2c3e50'
const SNAKE_COLOUR_PLAYER_1 = '#2ecc71'
const SNAKE_COLOUR_PLAYER_2 = '#9b59b6'
const FOOD_COLOUR = '#e74c3c'

let canvas, ctx, playerNumber, gameActive = false

const gameScreen = document.querySelector('#gameScreen')
const initialScreen = document.querySelector('#initialScreen')
const newGameButton = document.querySelector('#newGameButton')
const joinGameButton = document.querySelector('#joinGameButton')
const gameCodeInput = document.querySelector('#gameCodeInput')
const gameCodeDisplay = document.querySelector('#gameCodeDisplay')

socket.on('welcome', handleWelcome)
socket.on('init', handleInit)
socket.on('gameState', handleGameState)
socket.on('gameOver', handleGameOver)
socket.on('gameCode', handleGameCode)
socket.on('unknownGame', handleUnknownGame)
socket.on('tooManyPlayers', handleTooManyPlayers)

newGameButton.addEventListener('click', newGame)
joinGameButton.addEventListener('click', joinGame)

function handleWelcome(message) {
    console.log(message)
}

function newGame() {
    socket.emit('newGame')
    init()
}

function joinGame() {
    const code = gameCodeInput.value
    socket.emit('joinGame', code)
    init()
}

function init() {
    initialScreen.style.display = 'none'
    gameScreen.style.display = 'block'
    canvas = document.querySelector('#canvas')
    ctx = canvas.getContext('2d')
    canvas.width = 600
    canvas.height = 600
    ctx.fillStyle = BG_COLOUR
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    document.addEventListener('keydown', handleKeyDown)
    gameActive = true
}

function handleKeyDown(e) {
    socket.emit('keydown', e.keyCode)
}

function paintGame(state) {
    ctx.fillStyle = BG_COLOUR
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const { food, gridSize } = state
    const size = canvas.width / gridSize
    ctx.fillStyle = FOOD_COLOUR
    ctx.fillRect(food.x * size, food.y * size, size, size)
    paintPlayer(state.players[0], size, SNAKE_COLOUR_PLAYER_1)
    paintPlayer(state.players[1], size, SNAKE_COLOUR_PLAYER_2)
}

function paintPlayer(playerState, size, colour) {
    const { snake } = playerState
    ctx.fillStyle = colour
    for (let cell of snake) {
        ctx.fillRect(cell.x * size, cell.y * size, size, size)
    }
}

function handleInit(number) {
    playerNumber = number
}

function handleGameState(gameState) {
    if (!gameActive) return
    requestAnimationFrame(() => paintGame(gameState))
}

function handleGameOver(winner) {
    if (!gameActive) return
    gameActive = false
    if (winner === playerNumber) alert('You win!')
    else alert('You lose!')
    gameActive = false
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode
}

function handleUnknownGame() {
    reset()
    alert('Unknown Game Code!')
}

function handleTooManyPlayers() {
    reset()
    alert('This game is already in progress!')
}

function reset() {
    playerNumber = null
    gameCodeInput.value = ''
    gameCodeDisplay.innerText = ''
    gameScreen.style.display = 'none'
    initialScreen.style.display = 'block'
}