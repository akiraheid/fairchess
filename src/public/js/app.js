import * as ai from './ai.js'
import * as board from './board.js'
import { fairchess } from './fairchess.js'
import * as status from './status.js'

(() => {

	const game = new fairchess()

	const makeMove = (from, to, animate) => {
		const move = game.move({ from: from, to: to })
		if (move === null) { return 'snapback' }

		const piecePlacement = game.fen().split(' ')[0]
		board.load(piecePlacement, animate)
		status.updateTurnColors(game.turnNum())

		updateStatus()

		// AI move
		if (!game.gameOver() && game.activeColor() === 'b') {
			const aiMove = () => {
				console.log('Thinking...')
				const depth = parseInt($('#difficulty').find(':selected').val())
				const move = ai.move(game, depth)
				makeMove(move.from, move.to, true)
			}
			window.setTimeout(aiMove, 1000)
		}
	}

	const updateStatus = () => {
		const gameOverType = game.gameOver()
		const activeColor = game.activeColor()
		if (gameOverType) {
			switch (gameOverType) {
			case game.CHECKMATE:
				status.checkmate(activeColor)
				break

			case game.STALEMATE:
				status.stalemate()
				break

			case game.DRAW:
				status.draw()
				break

			case game.KING_TAKEN:
				status.kingTaken()
				break

			default:
				console.error('Reached unknown state')
			}
		} else {
			if (game.inCheck()) {
				status.check(activeColor)
			} else {
				status.resetMessage()
			}
		}
	}

	const onDrop = (source, target, _, _2, _3, _4) => {
		// Piece was selected to move
		if (source === target) {
			board.clickedPiece(source)
			return 'snapback'
		}

		if (!game.legal({from: source, to: target})) { return 'snapback' }

		return makeMove(source, target)
	}

	const onDragStart = (_, piece, _2, _3) => {
		const allowedMove = game.gameOver() === null
			&& piece.includes(game.activeColor())

		return allowedMove
	}

	const init = () => {
		const boardConfig = {
			onDragStart: onDragStart,
			onDrop: onDrop,
		}
		board.init(boardConfig)
		status.init()
	}

	// Exporter
	window['app'] = {
		init: init,
	}
})()

$(() => {
	const app = window['app']
	app.init()
})
