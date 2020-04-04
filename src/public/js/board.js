/* global ChessBoard */
const squareHighlight = 'square-highlight'
let lastClick = null

let onDropCb = () => { console.log('onDrop') }
let onDragStartCb = () => { console.log('onDragStart') }

function onDragStart(source, piece, position, orientation) {
	return onDragStartCb(source, piece, position, orientation)
}

function onDrop(source, target, piece, newPos, oldPos, orientation) {
	return onDropCb(source, target, piece, newPos, oldPos, orientation)
}

// Attempt to trigger a move if a piece is selected
function onEmptySquareClick(event) {
	if (lastClick !== null) {
		const square = event.data
		onDrop(lastClick, square)
		lastClick = null
		clearBoardHighlight()
	}
}

// Resize the board
function resize() {
	$('#board-container').css('max-height', '')
	$('#board-container').css('max-width', '')
	$('div[class^=board-]').css('position', 'static')
	board.resize()

	// Make board fit in the window
	const height = $(window).height() * 0.8
	let width = $('#board').css('width')
	width = parseInt(width.substring(0, width.length - 2))
	if (width > height) {
		const size = height + 'px'
		$('#board-container').css('max-height', size)
		$('#board-container').css('max-width', size)
		board.resize()
	}

	// Add click events to squares for click moving instead of dragging
	$('#board > div > div').children().each(function() {
		$(this).children().each(function() {
			$(this).click($(this).attr('data-square'), onEmptySquareClick)
		})
	})
}

const boardConfig = {
	draggable: true,
	dropOffBoard: 'snapback',
	onDragStart: onDragStart,
	onDrop: onDrop,
	position: 'start',
	pieceTheme: '/img/{piece}.svg'
}

const board = new ChessBoard('board', boardConfig)

// Public members ==============================================================

// Initialize the board
export const init = (config) => {
	onDragStartCb = config.onDragStart ? config.onDragStart : onDragStartCb
	onDropCb = config.onDrop ? config.onDrop : onDropCb
	resize()
	$(window).resize(resize)
}

// Load the given FEN and optionally animate the movement of pieces.
export const load = (piecePlacement, animate) => {
	if (animate === undefined) { animate = (lastClick !== null) }
	board.position(piecePlacement, animate)
	clearBoardHighlight()
}

// A square on the chessboard was clicked. Toggle highlight.
export const clickedPiece = (square) => {
	clearBoardHighlight()

	// Situations:
	// * select piece
	// * deselct piece
	// * select another piece when one already selected

	// Deselect same piece
	if (lastClick === square) {
		lastClick = null
	}

	// Select piece or a different piece
	else {
		lastClick = square
		$(`[id^=${square}-]`).addClass(squareHighlight)
	}
}

// Clear highlighted squares
export const clearBoardHighlight = () => {
	$(`.${squareHighlight}`).removeClass(squareHighlight)
}
