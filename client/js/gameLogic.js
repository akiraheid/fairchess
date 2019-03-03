var board;
var socket = io();
var game = new Chess();
var messageField = $('#message');
var status2Field = $('#status-2');
var turns = ['w','b','b','w','b','w','w','b','b','w','w','b','w'];
var turnCount = 0;
var kingTaken = false;
var gameOver = false;

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

// Move if legal
// Modified chessboardjs.com/examples#5000
function onDrop(source, target) {
	var move = game.move({
		from: source,
		to: target,
		promotion: 'q'
	});

	// Illegal move
	if (move === null) {
		return 'snapback';
	}

	socket.emit('move-request', {source: source, target: target})
};

function bitSum(i) {
	var sum = 0;
	while (i > 0) {
		sum = sum + i % 2;
		i = Math.floor(i / 2);
	}
	return sum%2;
};

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

function updateMove(data) {
	game.load(data.fen);
	board.position(data.fen.split(' ')[0], true);
	turnCount = data.turn;
	updateStatus(data.winner, data.winBy);
}

function displayError(err) {
	$('#error').css('display', '');
	$('#error').text(err);
}

socket.on('no-game', data => {
	displayError('Error: Sorry! We couldn\'t find your game :/\nPlease refresh the page');
});

socket.on('move-accepted', data => {
	console.log('Move accepted ' + data.fen);
	updateMove(data);
});

socket.on('move-rejected', data => {
	console.log('Move rejected ' + data.fen);
	updateMove(data);
});

socket.on('other-move', data => {
	console.log('Opponent moved ' + data.fen)
	updateMove(data);
});

socket.on('reconnect_error', data => {
	displayError('Error: Connection lost. Please refresh the page');
});

function resize() {
	board.resize();
	let width = $('#board').css('width');
	$("div[class^='board-']").css('position', 'static');
	// Remove weird chessboardjs left offset
	$("div[id^='board-']").css('left', '');
}

socket.on('multiplayer-found', data => {
	console.log('found another player ' + data.opponentID);

	var boardConfig = {
		draggable: true,
		dropOffBoard: 'snapback',
		onDragStart: onDragStart,
		onDrop: onDrop,
		onSnapEnd: onSnapEnd,
		position: 'start',
		pieceTheme: 'client/img/chesspieces/wikipedia/{piece}.png',
		orientation: data.isWhite ? 'white' : 'black'
	};
	board = ChessBoard('board', boardConfig);
	updateStatus(null, null);
	$('#game').css('display', '');
	$('#waiting').css('display', 'none');
	resize();
	$(window).resize(resize);
});

var init = function() {
	socket.emit('multiplayer-searching', {});
	$('#game').css('display', 'none');
	$('#error').css('display', 'none');
};

$(document).ready(init);
