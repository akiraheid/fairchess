const Chess = require('chess.js').Chess
const game = new Chess()

function bitSum(i) {
	var sum = 0;
	while (i > 0) {
		sum = sum + i % 2;
		i = Math.floor(i / 2);
	}
	return sum % 2;
};

exports.getNextFEN = (state, source, target) => {
	game.load(state.fen)

	let move = game.move({
		from: source,
		to: target,
		promotion: 'q' // TODO Make promotion option
	});

	if (move !== null) {
		let turnCount = state.turnNum + 1;
		let nextTurn = bitSum(turnCount) === 0 ? 'w' : 'b'

		// Update game fen
		let oldFEN = state.fen.split(' ')
		let fen = game.fen().split(' ')

		// Remove info about en passant target square if the same player is moving
		// again
		if (oldFEN[1] == nextTurn) {
			fen[3] = '-';
		}
		fen[1] = nextTurn;
		fen[5] = turnCount;

		return fen.join(' ')
	}

	return null
}
