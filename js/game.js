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

exports.getTurnColor = turnNum => {
	return (bitSum(turnNum) === 0) ? 'w' : 'b'
}

exports.getWinMethod = (fen, currentTurnColor, source, target) => {
	game.load(fen)

	let targetInfo = game.get(target)
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

	game.move({from: source, to: target, promotion: 'q'})

	if (game.in_checkmate()) {
		return 'mate'
	} else if (game.in_draw()) {
		return 'draw'
	} else if (game.in_stalemate()) {
		return 'stalemate'
	}
	return null
}

exports.getNextFEN = (state, source, target) => {
	game.load(state.fen)

	let move = game.move({
		from: source,
		to: target,
		promotion: 'q'
	});

	if (move !== null) {
		let turnCount = state.turnNum + 1;
		let nextTurn = exports.getTurnColor(state.turnNum + 1)

		// Update game fen
		let oldFEN = state.fen.split(' ')
		let fen = game.fen().split(' ')

		// Remove info about en passant target square if the same player is moving
		// again
		if (oldFEN[1] === nextTurn) {
			fen[3] = '-';
		}
		fen[1] = nextTurn;
		fen[5] = turnCount;

		return fen.join(' ')
	}

	return null
}
