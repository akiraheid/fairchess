import { fairchess } from './fairchess.js'

// Taking high-ranking pieces === good
const captureMap = {
	'p': 10,
	'b': 20,
	'n': 30,
	'r': 50,
	'q': 1000,
	'k': 50000
}

function evaluateBoard(board) {
	// Having more more/certain pieces than opponent is better
	let val = 0
	for (let i = 0; i < 8; ++i) {
		for (let j = 0; j < 8; ++j) {
			val += getPieceValue(board[i][j])
		}
	}

	return val
}

function getPieceValue(piece) {
	if (!piece) { return 0 }

	// TODO rename captureMap
	const val = captureMap[piece.type]
	return piece.color === 'w' ? val : -val
}

function minimax(game, depth, alpha, beta, maxPlayer) {
	++positionCount
	if (depth === 0 || game.gameOver()) { return -evaluateBoard(game.board()) }

	const nextMoves = game.moves({ verbose: true })

	if (maxPlayer) {
		let bestVal = -999999
		for (let i = 0; i < nextMoves.length; ++i) {
			const move = nextMoves[i]
			const tmpGame = fairchess(game.fen())
			tmpGame.move(move)

			const val = minimax(tmpGame, depth - 1, alpha, beta, move.color === 'w')
			bestVal = Math.max(bestVal, val)
			alpha = Math.max(alpha, bestVal)
			if (beta <= alpha) { return bestVal }
		}
		return bestVal
	} else {
		let bestVal = 999999
		for (let i = 0; i < nextMoves.length; ++i) {
			const move = nextMoves[i]
			const tmpGame = fairchess(game.fen())
			tmpGame.move(move)

			const val = minimax(tmpGame, depth - 1, alpha, beta, move.color === 'w')
			bestVal = Math.min(bestVal, val)
			beta = Math.min(beta, bestVal)
			if (beta <= alpha) { return bestVal }
		}
		return bestVal
	}
}

let positionCount = 0

function minimaxRoot(game, depth) {
	const nextMoves = game.moves({ verbose: true })
	let bestMove = undefined
	let bestVal = -999999

	for (let i = 0; i < nextMoves.length; ++i) {
		const move = nextMoves[i]
		const tmpGame = fairchess(game.fen())
		tmpGame.move(move)

		const val = minimax(tmpGame, depth - 1, -100000, 100000,
			tmpGame.turnColor === 'w')

		if (val > bestVal) {
			bestVal = val
			bestMove = move
		}
	}

	return bestMove
}

// PUBLIC MEMBERS ==============================================================

export const move = (game, depth) => {
	positionCount = 0
	const start = new Date().getTime()
	const bestMove = minimaxRoot(game, depth, true)
	const moveTime = (new Date().getTime() - start)
	const posPerSec = ( positionCount * 1000 / moveTime)

	console.log(`took ${moveTime / 1000} seconds`)
	console.log('moves / sec', posPerSec)

	return bestMove
}
