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

// Depth map for debugging AI decision tree
let decisionTree = undefined

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

	const val = captureMap[piece.type]
	return piece.color === 'w' ? val : -val
}

function minimax(game, depth, alpha, beta, maxPlayer) {
	++positionCount

	const fen = game.fen()
	const tree = {
		fen: fen,
		toMove: game.turnColor,
		val: 0,
		children: [],
	}

	if (depth === 0 || game.gameOver()) {
		tree.val = -evaluateBoard(game.board())
		return tree
	}

	const nextMoves = game.moves({ verbose: true })

	if (maxPlayer) {
		let bestVal = -999999
		for (let i = 0; i < nextMoves.length; ++i) {
			const move = nextMoves[i]
			const tmpGame = fairchess(game.fen())
			tmpGame.move(move)

			// TODO should move.color === 'w' be used? Does it need to be next
			// move?
			const ret = minimax(tmpGame, depth - 1, alpha, beta, move.color === 'w')
			const val = ret.val
			tree.children.push(ret)

			bestVal = Math.max(bestVal, val)
			if (bestVal >= beta) { break }
			alpha = Math.max(alpha, bestVal)
		}
		tree.val = bestVal
		return tree
	} else {
		let bestVal = 999999
		for (let i = 0; i < nextMoves.length; ++i) {
			const move = nextMoves[i]
			const tmpGame = fairchess(game.fen())
			tmpGame.move(move)

			const ret = minimax(tmpGame, depth - 1, alpha, beta, move.color === 'w')
			const val = ret.val
			tree.children.push(ret)

			bestVal = Math.min(bestVal, val)
			if (bestVal <= alpha) { break }
			beta = Math.min(beta, bestVal)
		}
		tree.val = bestVal
		return tree
	}
}

let positionCount = 0

function minimaxRoot(game, depth) {
	const nextMoves = game.moves({ verbose: true })
	let bestMoves = []
	let bestVal = -999999

	decisionTree = undefined

	const fen = game.fen()
	decisionTree = {
		fen: fen,
		toMove: game.turnColor,
		val: 0,
		children: [],
	}

	for (let i = 0; i < nextMoves.length; ++i) {
		const move = nextMoves[i]
		const tmpGame = fairchess(game.fen())
		tmpGame.move(move)

		const ret = minimax(tmpGame, depth - 1, -100000, 100000,
			tmpGame.turnColor === 'w')

		const val = ret.val
		decisionTree.children.push(ret)

		if (val > bestVal) {
			bestVal = val
			bestMoves = [move]
		} else if (val === bestVal) {
			bestMoves.push(move)
		}
	}

	decisionTree.val = bestVal
	console.log(decisionTree)
	return bestMoves[Math.floor(Math.random() * bestMoves.length)]
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
