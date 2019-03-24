HOME_PAGE = 'home'
GAME_PAGE = 'game'
WAIT_PAGE = 'wait'
WHITE = 'w'
BLACK = 'b'

var socketIOConfig = {
	autoConnect: false,
	path: '/socket.io'
}

var boardConfig = {
	draggable: true,
	dropOffBoard: 'snapback',
	onDragStart: onDragStart,
	onDrop: onDrop,
	onSnapEnd: onSnapEnd,
	position: 'start',
	pieceTheme: 'fairchess_client/img/chesspieces/wikipedia/{piece}.png'
}

var socket = io(socketIOConfig)
var messageField = $('#message')
var status2Field = $('#status-2')
var board = new ChessBoard('board', boardConfig)
var game = new Chess()
var tmpGame = new Chess()
var turns = ['w','b','b','w','b','w','w','b','b','w','w','b','w']
var turnCount = 0
var kingTaken = false
var gameOver = false
var opponentColor = undefined
var lastClick = undefined
var againstHuman = undefined

function getNextState(fen, source, target) {
	tmpGame.load(fen)

	let move = tmpGame.move({
		from: source,
		to: target,
		promotion: 'q'
	})

	if (move === null) {
		return null
	}

	let tmpTurnCount = turnCount + 1
	let nextTurn = getTurnColor(tmpTurnCount)

	// Update game fen
	let oldFEN = fen.split(' ')
	let fenParts = tmpGame.fen().split(' ')

	// Remove info about en passant target square if the same player is
	// moving again
	if (oldFEN[1] === nextTurn) {
		fenParts[3] = '-'
	}
	fenParts[1] = nextTurn
	fenParts[5] = tmpTurnCount

	let method = getWinMethod(fen, getTurnColor(turnCount), source, target)
	let winner = method !== null ? getTurnColor(turnCount) : null

	let nextState = {
		fen: fenParts.join(' '),
		winner: winner,
		winBy: method,
		turn: turnCount + 1
	}
	console.log(nextState)
	return nextState
}

function bitSum(i) {
	var sum = 0
	while (i > 0) {
		sum = sum + i % 2
		i = Math.floor(i / 2)
	}
	return sum % 2
}

function getWinMethod(fen, currentTurnColor, source, target) {
	tmpGame.load(fen)

	let targetInfo = tmpGame.get(target)
	if (targetInfo === null) {
		// No target piece
		return null
	}

	let kingTaken =
		(targetInfo.type === 'k')
		&& (targetInfo.color !== currentTurnColor)

	// Check king taken
	if (kingTaken) {
		return 'king'
	}

	tmpGame.move({from: source, to: target, promotion: 'q'})

	if (tmpGame.in_checkmate()) {
		return 'mate'
	} else if (tmpGame.in_draw()) {
		return 'draw'
	} else if (tmpGame.in_stalemate()) {
		return 'stalemate'
	}
	return null
}

// Update the turn
function updateStatus(winner, method) {
	var messageNumb = turnCount.toString()
	var message = ''
	var moveColor = 'White'
	var moveColors = []

	for (i = 0; i < turns.length; i++) {
		turns[i] = ((bitSum(turnCount + i) === 0) ? WHITE : BLACK)
		moveColors[i] = ((turns[i] === BLACK) ? 'Black' : 'White')
	}

	message = 'No Check'

	if (winner !== null) {
		gameOver = true
		if (method === 'mate') {
			message = 'Game over: ' + moveColors[0] + ' checkmated'
		} else if (method === 'draw') {
			message = 'Game over: draw'
		} else if (method === 'stalemate') {
			message = 'Game over: stalemate'
		} else if (method === 'king') {
			kingTaken = true
			message = 'Game over: ' + moveColors[0] + ' king taken'
		}
		messageField.toggleClass('bg-danger')
		status2Field.toggleClass('bg-danger')
	} else {
		if (game.in_check() === true) {
			message = moveColors[0] + ' in check'
			messageField.toggleClass('bg-warning text-dark')
			status2Field.toggleClass('bg-warning text-dark')
		} else {
			messageField.toggleClass('bg-danger bg-warning text-dark', false)
			status2Field.toggleClass('bg-danger bg-warning text-dark', false)
		}
	}

	messageField.html(message)
	status2Field.html(message)

	for (i = 0; i < turns.length; i++) {
		$('#turn-' + i).css('background-color', moveColors[i].toLowerCase())
		$('#message-' + i).css('background-color', moveColors[i].toLowerCase())
	}
}

function displayError(err) {
	$('#error').removeClass('d-none');
	$('#error').text(err);
}

function resize() {
	$('#board-container').css('max-height', '')
	$('#board-container').css('max-width', '')
	$("div[class^='board-']").css('position', 'static')
	board.resize()

	// Make board fit in the window
	let height = $(window).height() * 0.8
	let width = $('#board').css('width')
	width = parseInt(width.substring(0, width.length - 2))
	if (width > height) {
		let size = height + 'px'
		$('#board-container').css('max-height', size)
		$('#board-container').css('max-width', size)
		board.resize()
	}

	// Add click events to squares for click moving instead of dragging
	$('#board > div > div').children().each(function() {
		$(this).children().each(function() {
			$(this).click($(this).attr('data-square'), onEmptySquareClick)
		})
	})
}

function onEmptySquareClick(event) {
	if (lastClick !== null) {
		onDrop(lastClick, event.data)
	}
}

// Update board for things like en passant
function onSnapEnd() {
	// Board was already changed and disabled if the king was taken
	if (!kingTaken) {
		board.position(game.fen())
	}
}

function aiMove() {
	let moves = game.moves({verbose: true})
	let move = moves[Math.floor(Math.random() * moves.length)]
	let nextState = getNextState(game.fen(), move.from, move.to)
	updateMove(nextState, true)
}

function updateMove(data, animate) {
	game.load(data.fen);
	board.position(data.fen.split(' ')[0], animate);
	turnCount = data.turn;
	gameOver = data.gameOver
	lastClick = null

	if (againstHuman) {
		updateStatus(data.winner, data.winBy);
	} else {
		updateStatus(data.winner, data.winBy)

		if (data.winner === null && turns[0] === opponentColor) {
			setTimeout(aiMove, 1000)
		}
	}
}

// Only move if it is their turn and game is not over.
function onDragStart(source, piece, position, orientation) {
	if (gameOver
		|| (turns[0] === WHITE && piece.search(/^b/) !== -1)
		|| (turns[0] === BLACK && piece.search(/^w/) !== -1)
		|| ((turns[0] === WHITE) ? 'white' : 'black') !== orientation) {
		return false
	}
}

// Move if legal
function onDrop(source, target) {
	if (source === target) {
		// Toggle selection
		lastClick = lastClick === null ? source : null
		$('[id^='+source+'-]').toggleClass(
			'square-highlight', lastClick !== null)

		return 'snapback'
	}

	tmpGame.load(game.fen())
	var move = tmpGame.move({
		from: source,
		to: target,
		promotion: 'q'
	})

	// Clear highlighted squares
	lastClick = null
	$('[id^='+source+'-]').removeClass('square-highlight')
	$('[id^='+target+'-]').removeClass('square-highlight')

	// Illegal move
	if (move === null) {
		return 'snapback'
	}

	if (againstHuman) {
		socket.emit('move-request', {source: source, target: target})
	} else {
		let nextState = getNextState(game.fen(), source, target)
		updateMove(nextState, false)
	}
}

function resetGame() {
	lastClick = undefined
	turns = ['w','b','b','w','b','w','w','b','b','w','w','b','w']
	turnCount = 0
	kingTaken = false
	gameOver = false
	opponentColor = undefined
	againstHuman = undefined
	game.reset()
	tmpGame.reset()
	board.position(game.fen().split(' ')[0])
	updateStatus(null, null)
}

function getTurnColor(turnNum) {
	return (bitSum(turnNum) === 0) ? WHITE : BLACK
}

function orientBoard() {
	board.orientation(opponentColor === WHITE ? 'black' : 'white')
}

function chooseGame(event) {
	resetGame()
	againstHuman = event.data
	if (againstHuman) {
		enableSocket()
		socket.emit('multiplayer-searching', {});
	} else {
		opponentColor = Math.floor(Math.random() * 10) < 5 ? WHITE : BLACK
		orientBoard()

		// Move AI if AI is white
		if (opponentColor === WHITE) {
			window.setTimeout(aiMove, 1000)
		}
	}

	goToPage(againstHuman ? WAIT_PAGE : GAME_PAGE)
	$('#back-btn').removeClass('d-none')
}

function back() {
	socket.close()
	goToPage(HOME_PAGE)
	$('#back-btn').addClass('d-none')
}

function hideAllPages() {
	$('[id*=-page]').addClass('d-none')
}

function goToPage(page) {
	hideAllPages()
	$(`[id=${page}-page]`).removeClass('d-none')
	resize()
}

function enableSocket() {
	socket.open()
	socket.on('no-game', data => {
		displayError('Error: Sorry! We couldn\'t find your game :/\nPlease refresh the page')
	})

	socket.on('move-accepted', data => {
		console.log('Move accepted ' + data.fen)
		updateMove(data)
	})

	socket.on('move-rejected', data => {
		console.log('Move rejected ' + data.fen)
		updateMove(data)
	})

	socket.on('other-move', data => {
		console.log('Opponent moved ' + data.fen)
		updateMove(data)
	})

	socket.on('reconnect_error', data => {
		displayError('Error: Connection lost. Please refresh the page')
	})

	socket.on('multiplayer-found', data => {
		console.log('found another player ' + data.opponentID)
		opponentColor = data.isWhite ? BLACK : WHITE
		orientBoard()
		goToPage(GAME_PAGE)
	})
}

var init = function() {
	hideAllPages()
	goToPage(HOME_PAGE)
	$(window).resize(resize)

	$('#back-btn').click(back)
	$('#ai-btn').click(false, chooseGame)
	$('#human-btn').click(true, chooseGame)
}

$(document).ready(init)
