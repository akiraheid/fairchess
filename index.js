const express = require('express')
const app = express()
const serv = require('http').Server(app)
const io = require('socket.io')(serv, {})
const uuid = require('uuid/v4')
const game = require('./js/game.js')

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/client/index.html')
})
app.get('/ai', (req, res) => {
	res.sendFile(__dirname + '/client/ai.html')
})
app.get('/multiplayer', (req, res) => {
	res.sendFile(__dirname + '/client/multiplayer.html')
})
app.use('/client', express.static(__dirname + '/client'))

const PORT = 8082
serv.listen(PORT)
console.log('Server listening on port ' + PORT)

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
let sockets = new Map()
let unmatchedPlayers = []
let matchedPlayers = new Map()
let games = new Map()

function matchPlayer(socket) {
	console.log('multiplayer search ' + socket.id)
	// No other players waiting so try to match during the periodic match
	if (unmatchedPlayers.length === 0) {
		unmatchedPlayers.push(socket.id)
		console.log('Added to queue ' + socket.id)
		return
	}

	// Match with a queued player
	while (unmatchedPlayers.length != 0) {
		let otherPlayerID = unmatchedPlayers.shift()
		console.log('Try match with ' + otherPlayerID)
		if (!sockets.has(otherPlayerID)) {
			console.log('Stale player, removing ' + otherPlayerID)
			continue
		}

		let isWhite = (Math.floor(Math.random() * 10) < 5)
		let gameInfo = {
			white: isWhite ? socket.id : otherPlayerID,
			black: !isWhite ? socket.id : otherPlayerID,
			fen: DEFAULT_FEN,
			turnNum: 0
		}

		// Key the game with the players
		games.set(socket.id + otherPlayerID, gameInfo)

		// Map players as matched to each other
		matchedPlayers.set(socket.id, otherPlayerID)
		matchedPlayers.set(otherPlayerID, socket.id)

		let playerInfo = {
			opponentID: otherPlayerID,
			isWhite: isWhite
		}

		let opponentInfo = {
			opponentID: socket.id,
			isWhite: !isWhite
		}

		socket.emit('multiplayer-found', playerInfo)
		sockets.get(otherPlayerID).emit('multiplayer-found', opponentInfo)

		console.log('Matched ' + socket.id + ' with ' + otherPlayerID)
		return
	}
}

function playerDisconnected(playerID) {
	console.log('- Disconnect ' + playerID)
	sockets.delete(playerID)
	if (playerID in matchedPlayers.keys()) {
		let otherPlayerID = matchedPlayers.get(playerID)
		matchedPlayers.delete(playerID)
		matchedPlayers.delete(otherPlayerID)
	}
}

// Get the game for the players with the given IDs
//
// @return The game if it exists; undefined otherwise
function getGameState(id1, id2) {
	let id = id1 + id2
	return games.has(id) ? games.get(id) : games.get(id2 + id1)
}

function acceptMove(socket, data, newFEN, state) {
	console.log('Accept move ' + socket.id + ' ' + data.source + data.target)
	let otherPlayerID = matchedPlayers.get(socket.id)
	let requestorColor = ((state.white === socket.id) ? 'w' : 'b')

	let method =
		game.getWinMethod(state.fen, requestorColor, data.source, data.target)
	let winner = ((method === null) ? null : requestorColor)

	state.fen = newFEN
	state.turnNum = state.turnNum + 1
	let update = {
		fen: state.fen,
		turn: state.turnNum,
		winner: winner,
		winBy: method
	}

	socket.emit('move-accepted', update)
	sockets.get(otherPlayerID).emit('other-move', update)
}

function rejectMove(socket, data, state) {
	console.log('Reject move ' + socket.id + ' ' + data.source + data.target)
	let update = {fen: state.fen, turn: state.turnNum, gameOver: false}
	socket.emit('move-rejected', update)
}

function sendGameDoesntExist(socket, data) {
	console.log('Got move request for ' + socket.id
		+ ' but a game doesn\'t exist')

	socket.emit('no-game', undefined)
}

function validData(data) {
	let boardSquareReg = /[a-h][1-8]/
	if (!boardSquareReg.test(data.source)
		|| !boardSquareReg.test(data.target)) {
		return false
	}
	return true
}

function moveRequested(socket, data) {
	console.log('Move request ' + socket.id + ' ' + data.source + data.target)

	let otherPlayerID = matchedPlayers.get(socket.id)
	let state = getGameState(socket.id, otherPlayerID)

	if (state === undefined) {
		sendGameDoesntExist(socket, data)
		return
	}

	if (!validData(data)) {
		rejectMove(socket, data, state)
		return
	}

	let requestorColor = ((state.white === socket.id) ? 'w' : 'b')
	if (requestorColor != game.getTurnColor(state.turnNum)) {
		rejectMove(socket, data, state)
		return
	}

	let nextFEN = game.getNextFEN(state, data.source, data.target)
	console.log(socket.id + ' ' + nextFEN)
	nextFEN !== null
		? acceptMove(socket, data, nextFEN, state)
		: rejectMove(socket, data, state)
}

io.sockets.on('connection', socket => {
	socket.id = uuid()
	sockets.set(socket.id, socket)
	console.log('+ Connection ' + socket.id)

	socket.on('multiplayer-searching', data => {
		try {
			matchPlayer(socket)
		} catch (e) {
			console.log(e)
		}
	})

	socket.on('disconnect', data => {
		try {
			playerDisconnected(socket.id)
		} catch (e) {
			console.log(e)
		}
	})

	socket.on('move-request', data => {
		try {
			moveRequested(socket, data)
		} catch (e) {
			console.log(e)
		}
	})
})
