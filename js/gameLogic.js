var board;

var init = function() {
  var boardConfig = {
    draggable: true,
    dropOffBoard: 'snapback',
    position: 'start'
  };

  var board = ChessBoard('board', boardConfig);
};

$(document).ready(init);
