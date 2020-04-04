import { fairchess } from './fairchess.js'

// Greedy
function heuristic(node) {
	const game = new fairchess(node.fen)

	// More pieces === better
	const board = game.board()
	const activeColor = game.activeColor()
	let num = 0
	board.forEach((row) => {
		row.forEach((col) => {
			if (col) {
				if (col.color === activeColor) { ++num }
				else { --num }
			}
		})
	})

	// Taking high-ranking pieces === good
	const captureMap = {
		'p': 10,
		'b': 20,
		'n': 30,
		'r': 50,
		'q': 1000,
		'k': Number.MAX_SAFE_INTEGER
	}
	let capturePoints = 0
	const pieceCaptured = node.move.captured
	if (pieceCaptured !== undefined) { capturePoints = captureMap[pieceCaptured] }

	// Check/checkmate/stalemate is good
	const gameOverMap = {}
	gameOverMap[game.CHECK] = 1000
	gameOverMap[game.DRAW] = 599999
	gameOverMap[game.STALEMATE] = 599999
	gameOverMap[game.CHECK_MATE] = Number.MAX_SAFE_INTEGER
	gameOverMap[game.KING_TAKEN] = Number.MAX_SAFE_INTEGER
	const gameOverType = game.gameOver()
	let gameOverPoints = 0
	if (gameOverType !== null) { gameOverPoints = gameOverMap[gameOverType] }

	return num + capturePoints + gameOverPoints
}

function alphabeta(game) {
	const MAXIMIZE = game.activeColor()
	console.debug(`active maximization for ${MAXIMIZE}`)

	// Determine if the game is being maximized for the active player of the
	// origin
	function maximize(fen) {
		const game = new fairchess(fen)
		return game.activeColor === MAXIMIZE
	}

	function makeChildren(fen) {
		const game = new fairchess(fen)
		const moves = game.moves({ verbose: true })

		const children = []
		moves.forEach((move) => {
			const testGame = new fairchess(fen)
			testGame.move(move)
			const node = { fen: testGame.fen(), move: move }
			if (testGame.gameOver()) {
				node.terminal = true
				children.push(node)
			} else { children.push(node) }
		})

		return children
	}

	// TODO
	// * Ignore boards where none of active player's pieces are under attack
	const helper = (node, depth, alpha, beta, maximizingPlayer) => {
		++numAnalyzed

		if (depth === 0 || node.terminal) {
			const score = heuristic(node)

			// Debug messages
			if (numAnalyzed % 10000 === 0) {
				if (score > bestScore) {
					bestScore = score
				}
				console.debug(`Considered ${numAnalyzed} moves`)
				console.debug(`Best score ${bestScore}`)
			}

			return { val: score }
		}

		const children = makeChildren(node.fen)
		let bestFEN = undefined
		let val = maximizingPlayer ? -999999 : 999999
		const tree = {}

		if (maximizingPlayer) {
			for (let i = 0; i < children.length; ++i) {
				const child = children[i]
				const result = helper(child, depth - 1, alpha, beta, maximize(child.fen))
				const newVal = result.val
				const key = `${child.move.from}-${child.move.to}`
				tree[key] = result
				if (newVal > val) {
					bestFEN = child.fen
					val = newVal
				}
				alpha = Math.max(alpha, val)
				if (alpha >= beta) {
					break
				}
			}
		} else {
			for (let i = 0; i < children.length; ++i) {
				const child = children[i]
				const result = helper(child, depth - 1, alpha, beta, maximize(child.fen))
				const newVal = result.val
				const key = `${child.move.from}-${child.move.to}`
				tree[key] = result
				if (newVal < val) {
					bestFEN = child.fen
					val = newVal
				}
				beta = Math.min(beta, val)
				if (alpha >= beta) {
					break
				}
			}
		}

		tree.best = { val: val, fen: bestFEN }
		tree.val = val
		return tree
	}

	const depth = 1
	console.log('find best move from fen', game.fen())
	const children = makeChildren(game.fen())
	let numAnalyzed = 0
	let bestScore = 0
	let idx = 0
	let val = -999999999
	const tree = {}
	for (let i = 0; i < children.length; ++i) {
		const child = children[i]
		const result = helper(child, depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, true)
		const key = `${child.move.from}-${child.move.to}`
		tree[key] = result

		const newVal = result.val
		if (newVal > val) {
			val = newVal
			idx = i
		}
	}
	const best = children[idx]
	tree.best = { val: val, fen: best.fen }
	console.debug(`High score: ${val}`)
	console.debug('FEN', best.fen)
	console.debug('tree', tree)
	return best.move
}

//function random(game) {
//	const legalMoves = game.moves({ verbose: true })
//	return legalMoves[Math.floor(Math.random() * legalMoves.length)]
//}

const aiType = alphabeta
//let aiType = random

// PUBLIC MEMBERS ==============================================================

export const move = (game) => {
	return aiType(game)
}
