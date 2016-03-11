var board,
    game = new Chess(),
    messageField = $('#message'),
    turn = 'w',
	turn_count = 0;

// Only move if it is their turn and game is not over.
// Modified chessboardjs.com/examples#5000
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (turn === 'w' && piece.search(/^b/) !== -1) ||
      (turn === 'b' && piece.search(/^w/) !== -1)) {
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
  // TODO Update to use fair sequence
  turn = (turn === 'w' ? 'b' : 'w');
  updateStatus();
};

// Update the board after piece is done snapping
// chessboardjs.com/examples#5000
var onSnapEnd = function() {
  board.position(game.fen());
};

// Update the turn
// Modified chessboardjs.com/examples#5000
var updateStatus = function() {
  var message = '';
  var moveColor = (turn === 'b' ? 'Black' : 'White');

  if (game.in_checkmate() === true) {
    message = 'Game over: ' + moveColor + ' is checkmated.';
  }
  else if (game.in_draw() === true) {
    message = 'Game over: Draw';
  }
  else {
    message = moveColor + ' to move';

    if (game.in_check() === true) {
      message += ', ' + moveColor + ' is in check';
    }
  }

  messageField.html(message);
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
