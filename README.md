# Fair Chess
We love chess, but is it fair?

With this twist on regular chess, Fair Chess implements the [fairest sharing sequence](https://youtu.be/prh72BLNjIk) for the turn order.

## Rules
The same rules as regular chess but with the turn order changed! Some side effects of that new rule:
* Kings can be taken as a second move
* Players can't move through check

## Configuration
The server has an optional root path that can be configured by setting the `FAIRCHESS_ROOT` environment variable to be the desired URI. By default, the URI is the root URI (`/`).

Set the root URI to be something other than the default. Note that the specified URI must start with a `/`.
```
$ export FAIRCHESS_ROOT="/fairchess"
```

## Support
Check out the projects that made this possible:
* [chess.js](https://github.com/jhlywa/chess.js)
* [chessboard.js](https://github.com/oakmac/chessboardjs/)
* [jQuery](https://jquery.com)

Brought to you by myself and [@bbeallo12](https://github.com/bbeallo12)
