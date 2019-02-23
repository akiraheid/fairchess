var board;
var socket = io();
var game = new Chess();
var messageField = $('#message');
var messageFields = [];
var turns = ['w','b','b','w','b','w','w','b','b','w','w','b','w'];
var turnCount = 0;
var kingTaken = false;
var gameOver = false;

messageFields[0] = $('#message0');
messageFields[1] = $('#message1');
messageFields[2] = $('#message2');
messageFields[3] = $('#message3');
messageFields[4] = $('#message4');
messageFields[5] = $('#message5');
messageFields[6] = $('#message6');
messageFields[7] = $('#message7');
messageFields[8] = $('#message8');
messageFields[9] = $('#message9');
messageFields[10] = $('#message10');
messageFields[11] = $('#message11');
messageFields[12] = $('#message12');

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
	var messages = [];
	var moveColors = [];

	for (i = 0; i <= 12; i++) {
		turns[i] = ((bitSum(turnCount + i) === 0) ? 'w' : 'b');
		messages[i] = '';
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
	} else {
		for (i = 0; i <= 12; i++) {
			messages[i] = moveColors[i] + ' to move';
		}

		if (game.in_check() === true) {
			message = moveColors[0] + ' is in check';
		}
	}

	messageField.html(message);

	for (i = 0; i <= 12; i++) {
		messageFields[i].html(messages[i]);
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
	$('#game').css('display', 'inline');
	$('#waiting').css('display', 'none');
});

var init = function() {
	socket.emit('multiplayer-searching', {});
};

$(document).ready(init);
