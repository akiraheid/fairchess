export const black = 'b'
export const white = 'w'

// Get the player color on turn given. 0-indexed
export const getTurnColor = (turnNum) => {
	let sum = 0
	while (turnNum > 0) {
		sum = sum + turnNum % 2
		turnNum = Math.floor(turnNum / 2)
	}
	const val = sum % 2
	return (val === 0) ? white : black
}

// Return true if `object` has key `key`.
export const hasKey = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
