const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const { PORT, FRAME_RATE } = require('./config')
const { gameLoop, getUpdatedVelocity, initGame } = require('./game')
const random = require('./random')

const app = express()
const httpServer = http.createServer(app)
const io = socketio(httpServer)

app.use(express.static('public'))

const state = {}
const rooms = {}

io.on('connection', client => {
    client.emit('welcome', 'Welcome to Snakify - A Snake Multiplayer Game!')

    client.on('keydown', keyCode => {
        const roomName = rooms[client.id]
        if (!roomName) return
        try {
            keyCode = parseInt(keyCode)
        } catch (err) {
            console.log(err)
            return
        }
        const velocity = getUpdatedVelocity(keyCode)
        if (velocity) state[roomName].players[client.number - 1].velocity = velocity
    })

    client.on('newGame', () => {
        const roomName = random(5)
        rooms[client.id] = roomName
        client.emit('gameCode', roomName)
        state[roomName] = initGame()
        client.join(roomName)
        client.number = 1
        client.emit('init', 1)
    })

    client.on('joinGame', gameCode => {
        const room = io.sockets.adapter.rooms[gameCode]
        let allUsers
        if (room) allUsers = room.sockets
        let numClients = 0
        if (allUsers) numClients = Object.keys(allUsers).length
        if (numClients === 0) return client.emit('unknownGame')
        else if (numClients > 1) return client.emit('tooManyPlayers')
        rooms[client.id] = gameCode
        client.join(gameCode)
        client.number = 2
        client.emit('init', 2)
        startGameInterval(gameCode)
    })
})

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const winner = gameLoop(state[roomName])
        if (!winner) {
            emitGameState(roomName, state[roomName])
        } else {
            emitGameOver(roomName, winner)
            state[roomName] = undefined
            clearInterval(intervalId)
        }
    }, 1000 / FRAME_RATE);
}

function emitGameState(roomName, state) {
    io.sockets.in(roomName).emit('gameState', state)
}

function emitGameOver(roomName, winner) {
    io.sockets.in(roomName).emit('gameOver', winner)
}

httpServer.listen(
    PORT,
    console.log(`Server started on port ${PORT}...`)
)