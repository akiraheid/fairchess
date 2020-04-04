import * as util from './util.js'

// The number of turn lookahead including the current turn
const numTurns = 12
const $message = $('#message')
const $status2 = $('#status-2')

function toggleClass(classStr) {
	$message.toggleClass(classStr)
	$status2.toggleClass(classStr)
}

function colorToWord(color) {
	return color === 'w' ? 'White' : 'Black'
}

export const init = () => {
	updateTurnColors(0)
}

export const updateTurnColors = (turnNum) => {
	let color = 'w'
	for (let i = 0; i < numTurns; ++i) {
		color = util.getTurnColor(turnNum + i) === 'w' ? 'white' : 'black'
		$('#turn-' + i).css('background-color', color)
		$('#message-' + i).css('background-color', color)
	}
}

export const check = (color) => {
	const word = colorToWord(color)
	updateMessage(`${word} in check`)
	toggleClass('bg-warning text-dark')
}

export const checkmate = (color) => {
	const word = colorToWord(color)
	updateMessage(`${word} checkmated`)
	toggleClass('bg-danger')
}

export const draw = () => {
	updateMessage('Draw')
	toggleClass('bg-danger')
}

export const kingTaken = () => {
	updateMessage('King taken')
	toggleClass('bg-danger')
}

export const resetMessage = () => {
	updateMessage('')
	$message.toggleClass('bg-danger bg-warning text-dark', false)
	$status2.toggleClass('bg-danger bg-warning text-dark', false)
}

export const stalemate = () => {
	updateMessage('Stalemate')
	toggleClass('bg-danger')
}

export const updateMessage = (message) => {
	$message.html(message)
	$status2.html(message)
}
