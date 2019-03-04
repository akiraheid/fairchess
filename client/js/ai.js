var board;
var game = new Chess();
var tmpGame = new Chess();
var messageField = $('#message');
var status2Field = $('#status-2');
var turns = ['w','b','b','w','b','w','w','b','b','w','w','b','w'];
var turnCount = 0;
var kingTaken = false;
var gameOver = false;
var aiColor;
var lastClick = null;

// Only move if it is their turn and game is not over.
// Modified chessboardjs.com/examples#5000
function onDragStart(source, piece, position, orientation) {
	if (gameOver
		|| (turns[0] === 'w' && piece.search(/^b/) !== -1)
		|| (turns[0] === 'b' && piece.search(/^w/) !== -1)
		|| ((turns[0] === 'w') ? 'white' : 'black') !== orientation) {
		return false;
	}
};

function getTurnColor(turnNum) {
	return (bitSum(turnNum) === 0) ? 'w' : 'b'
}

function getNextState(fen, source, target) {
	tmpGame.load(fen);

	let move = tmpGame.move({
		from: source,
		to: target,
		promotion: 'q'
	});

	if (move === null) {
		return null;
	}

	let tmpTurnCount = turnCount + 1;
	let nextTurn = getTurnColor(tmpTurnCount);

	// Update game fen
	let oldFEN = fen.split(' ');
	let fenParts = tmpGame.fen().split(' ');

	// Remove info about en passant target square if the same player is
	// moving again
	if (oldFEN[1] === nextTurn) {
		fenParts[3] = '-';
	}
	fenParts[1] = nextTurn;
	fenParts[5] = tmpTurnCount;

	let method = getWinMethod(fen, getTurnColor(turnCount), source, target)
	let winner = method !== null ? getTurnColor(turnCount) : null

	let nextState = {
		fen: fenParts.join(' '),
		winner: winner,
		method: method,
		gameOver: method !== null
	}
	console.log(nextState)
	return nextState;
}

// Move if legal
// Modified chessboardjs.com/examples#5000
function onDrop(source, target) {
	if (source === target) {
		// Toggle selection
		lastClick = lastClick === null ? source : null;
		$('[id^='+source+'-]').toggleClass(
			'square-highlight', lastClick !== null);

		return 'snapback';
	}

	tmpGame.load(game.fen());
	var move = tmpGame.move({
		from: source,
		to: target,
		promotion: 'q'
	});

	lastClick = null;
	$('[id^='+source+'-]').removeClass('square-highlight');
	$('[id^='+target+'-]').removeClass('square-highlight');

	// Illegal move
	if (move === null) {
		return 'snapback';
	}

	let nextState = getNextState(game.fen(), source, target);
	updateMove(nextState, false);
};

function bitSum(i) {
	var sum = 0;
	while (i > 0) {
		sum = sum + i % 2;
		i = Math.floor(i / 2);
	}
	return sum%2;
};

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
// Modified chessboardjs.com/examples#5000
function updateStatus(winner, method) {
	var messageNumb = turnCount.toString();
	var message = '';
	var moveColor = 'White';
	var moveColors = [];

	for (i = 0; i < turns.length; i++) {
		turns[i] = ((bitSum(turnCount + i) === 0) ? 'w' : 'b');
		moveColors[i] = ((turns[i] === 'b') ? 'Black' : 'White');
	}

	message = 'No Check';

	if (winner !== null) {
		gameOver = true;
		if (method === 'mate') {
			message = 'Game over: ' + moveColors[0] + ' checkmated';
		} else if (method === 'draw') {
			message = 'Game over: draw';
		} else if (method === 'stalemate') {
			message = 'Game over: stalemate';
		} else if (method === 'king') {
			kingTaken = true;
			message = 'Game over: ' + moveColors[0] + ' king taken';
		}
		messageField.toggleClass('bg-danger');
		status2Field.toggleClass('bg-danger');
	} else {
		if (game.in_check() === true) {
			message = moveColors[0] + ' in check';
			messageField.toggleClass('bg-warning text-dark');
			status2Field.toggleClass('bg-warning text-dark');
		} else {
			messageField.toggleClass('bg-danger bg-warning text-dark', false);
			status2Field.toggleClass('bg-danger bg-warning text-dark', false);
		}
	}

	messageField.html(message);
	status2Field.html(message);

	for (i = 0; i < turns.length; i++) {
		$('#turn-' + i).css('background-color', moveColors[i].toLowerCase());
		$('#message-' + i).css('background-color', moveColors[i].toLowerCase());
	}
};

// Update board for things like en passant
function onSnapEnd() {
	// Board was already changed and disabled if the king was taken
	if (!kingTaken) {
		board.position(game.fen());
	}
}

function updateMove(state, animate) {
	game.load(state.fen);
	board.position(state.fen.split(' ')[0], animate);
	turnCount = turnCount + 1;
	gameOver = state.gameOver;
	updateStatus(state.winner, state.method);

	if (!gameOver && turns[0] === aiColor) {
		setTimeout(aiMove, 1000);
	}
}

function resize() {
	board.resize();
	let width = $('#board').css('width');
	$("div[class^='board-']").css('position', 'static');
	// Remove weird chessboardjs left offset
	$("div[id^='board-']").css('left', '');
}

function aiMove() {
	let moves = game.moves({verbose: true});
	let move = moves[Math.floor(Math.random() * moves.length)];
	let nextState = getNextState(game.fen(), move.from, move.to);
	updateMove(nextState, true);
}

function onEmptySquareClick(event) {
	if (lastClick !== null) {
		onDrop(lastClick, event.data);
	}
}

var init = function() {
	aiColor = Math.floor(Math.random() * 10) < 5 ? 'w' : 'b'

	var boardConfig = {
		draggable: true,
		dropOffBoard: 'snapback',
		onDragStart: onDragStart,
		onDrop: onDrop,
		onSnapEnd: onSnapEnd,
		position: 'start',
		pieceTheme: 'client/img/chesspieces/wikipedia/{piece}.png',
		orientation: aiColor === 'b' ? 'white' : 'black'
	};
	board = ChessBoard('board', boardConfig);
	updateStatus(null, null);
	$('#game').css('display', '');
	resize();
	$(window).resize(resize);

	// Add click events to squares for click moving instead of dragging
	$('#board > div > div').children().each(function() {
		$(this).children().each(function() {
			$(this).click($(this).attr('data-square'), onEmptySquareClick);
		});
	});

	// Move AI if AI is white
	if (aiColor === 'w') {
		window.setTimeout(aiMove, 1000);
	}
};

$(document).ready(init);
