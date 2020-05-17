/* global define */

// A layer on top of ChessJS to implement Fair Chess turn order and provide a
// subset of functionality.
import Chess from 'chess.js/chess.js'
import * as util from './util.js'

export const fairchess = function(startingFEN) {
	const CHECK = 'check'
	const CHECKMATE = 'checkmate'
	const DRAW = 'draw'
	const KING_TAKEN = 'king taken'
	const STALEMATE = 'stalemate'

	const defaultPromotePiece = 'q'
	const game = new Chess(startingFEN)

	// Stateful data
	let kingWasTaken = false
	let turnCount = 0
	if (startingFEN) {
		turnCount = getTurnCountFromFEN(startingFEN)
	}

	// Get the current turn's color
	function activeColor() { return util.getTurnColor(turnCount) }

	function board() { return game.board({ verbose: true }) }

	// Get the current game state as FEN.
	function fen() { return game.fen() }

	// Return the type of game over if the game is over; `null` otherwise.
	//
	// ```
	// fairchess.inCheck()
	// // true
	//
	// fairchess.gameOver() == fairchess.CHECK
	// // true
	// ```
	function gameOver() {
		if (kingTaken()) { return KING_TAKEN }
		if (inCheckmate()) { return CHECKMATE }
		if (inDraw()) { return DRAW }
		if (inStalemate()) { return STALEMATE }

		return null
	}

	// Extract the current turn count from the FEN.
	function getTurnCountFromFEN(fen) {
		const parts = fen.split(' ')
		return Number(parts[5])
	}

	function inCheck() { return game.in_check() }
	function inCheckmate() { return game.in_checkmate() }
	function inDraw() { return game.in_draw() }
	function inStalemate() { return game.in_stalemate() }
	function kingTaken() { return kingWasTaken }

	// Return `true` if the move is legal; `false` otherwise.
	function legal(move) {
		const legalMoves = game.moves({ square: move.from, verbose: true })
		const isLegal = legalMoves.some(legalMove => legalMove.to === move.to)
		return isLegal
	}

	// Move and return move object if legal; do nothing and return `null` otherwise.
	function makeMove(move) {
		if (!legal({ from: move.from, to: move.to })) { return }

		// Hack game fen for fair chess turn order
		const nextTurnCount = turnCount + 1
		const nextTurnColor = util.getTurnColor(nextTurnCount)

		const previousParts = game.fen().split(' ')

		// Check if king taken
		const piece = game.get(move.to)
		if (piece && piece.type === 'k') { kingWasTaken = true }

		// Move
		const ret = game.move({ from: move.from, to: move.to, promotion: defaultPromotePiece })

		const nextParts = game.fen().split(' ')

		// TODO Leave en passant target square if opponent set it
		// Remove info about en passant target square if the same player is moving
		// again
		if (previousParts[1] === nextTurnColor) { nextParts[3] = '-' }
		nextParts[1] = nextTurnColor
		nextParts[5] = nextTurnCount

		const nextFEN = nextParts.join(' ')
		game.load(nextFEN)
		turnCount = nextTurnCount

		return ret
	}

	// Get a list of legal moves.
	//
	// When a specific square is not specified, this function returns a list of all
	// legal moves from any square.
	//
	// When a specific square is specified via `from` key in `options`, only a list
	// of legal moves from that square are returned. Taking a king is legal.
	//
	// ```js
	// fairchess.moves()
	// // [ 'a3', 'a4', 'b3', 'b4', etc. ]
	//
	// fairchess.moves({ from: 'e2' })
	// // [ 'e3', 'e4' ]
	// ```
	//
	// Verbose output can be specified via `verbose` key being `true` in options
	// (default `false`).
	//
	// ```js
	// fairchess.moves({ from: 'e2', verbose: true })
	// // [{ from: 'e2', to: 'e3', color: 'w', flag: 'n', piece: 'p'}]
	// ```
	//
	function moves(options) {
		return game.moves(options)
	}

	function turnNum() { return turnCount }


	// PUBLIC API ==============================================================
	return {
		BLACK: 'b',
		CHECK: CHECK,
		CHECKMATE: CHECKMATE,
		DRAW: DRAW,
		KING_TAKEN: KING_TAKEN,
		STALEMATE: STALEMATE,
		WHITE: 'w',

		activeColor: function() { return activeColor() },
		board: function() { return board() },
		fen: function() { return fen() },
		gameOver: function() { return gameOver() },
		inCheck: function() { return inCheck() },
		inCheckmate: function() { return inCheckmate() },
		inDraw: function() { return inDraw() },
		inStalemate: function() { return inStalemate() },
		kingTaken: function() { return kingTaken() },
		legal: function(move) { return legal(move) },
		move: function(move) { return makeMove(move) },
		moves: function(options) { return moves(options) },
		turnNum: function() { return turnNum() },
	}
}

// export if using node or any other CommonJS compatible environment
if (typeof exports !== 'undefined') { exports.fairchess = fairchess }

// export for any RequireJS compatible environment
if (typeof define !== 'undefined') { define(function() { return fairchess }) }
