var board;
var game = new Chess();
var messageFieldNumb = $('#messageNumb');
var messageField = $('#message');
var messageFields = [];
var turns = ['w','b','b','w','b','w','w','b','b','w','w','b','w'];
var turnCount = 0;

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
var onDragStart = function(source, piece, position, orientation) {
	if (game.game_over() === true ||
			(turns[0] === 'w' && piece.search(/^b/) !== -1) ||
			(turns[0] === 'b' && piece.search(/^w/) !== -1)) {
		return false;
	}
};

// Move if legal
// Modified chessboardjs.com/examples#5000
var onDrop = function(source, target) {
	var move = game.move({
		from: source,
		to: target,
		promotion: 'q' // TODO Make promotion option
	});

	if (move === null) {
		return 'snapback';
	}

	// Valid move
	turnCount = turnCount + 1;
	for (i = 0; i < 12; i++) {
		turns[i] = (bitSum(turnCount + i) === 0 ? 'w' : 'b');
	}

	var fen = game.fen();
	var newFenArr = fen.split(' ');
	// Increment the turn number if the current player is black and the next turn
	// is white.
	if (fen.search(' w ') != -1 && turns[i] == 'b') {
		var tmp = Number(newFenArr[5]) + 1;
		newFenArr[5] = tmp.toString();
	}

	// Change the turn based on turns[]
	newFenArr[1] = turns[0];
	game.load(newFenArr.join(' '));
	updateStatus();
};

var bitSum = function(i) {
	var sum = 0;
	while (i > 0) {
		sum = sum + i % 2;
		i = Math.floor(i / 2);
	}
	return sum%2;
};

// Update the board after piece is done snapping
// chessboardjs.com/examples#5000
var onSnapEnd = function() {
	board.position(game.fen());
};

// Update the turn
// Modified chessboardjs.com/examples#5000
var updateStatus = function() {
	var messageNumb = turnCount.toString();
	var message = '';
	var moveColor = 'White';
	var messages = [];
	var moveColors = [];

	for (i = 0; i <= 12; i++) {
		messages[i] = '';
		moveColors[i] = (turns[i] === 'b' ? 'Black' : 'White');
	}

	if (game.in_checkmate() === true) {
		message = 'Game over: ' + moveColors[0] + ' is checkmated.';
	}
	else if (game.in_draw() === true) {
		message = 'Game over: Draw';
	}
	else {
		message = 'No Check';

		for (i = 0; i <= 12; i++) {
			messages[i] = moveColors[i] + ' to move';
		}

		if (game.in_check() === true) {
			message = moveColors[0] + ' is in check';
		}
	}

	messageFieldNumb.html(messageNumb);
	messageField.html(message);
	for (i = 0; i <= 12; i++) {
		messageFields[i].html(messages[i]);
	}
};

var init = function() {
	var boardConfig = {
		draggable: true,
		dropOffBoard: 'snapback',
		onDragStart: onDragStart,
		onDrop: onDrop,
		onSnapEnd: onSnapEnd,
		position: 'start'
	};

	board = ChessBoard('board', boardConfig);
	updateStatus();
};

$(document).ready(init);
