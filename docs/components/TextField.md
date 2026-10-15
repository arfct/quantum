# TextField

Text fields let people enter and edit text. The consumer provides a `label`, optional `helperText`, `error`, and the usual input props (`value`/`onChange` or `defaultValue`, `type`, `name`).

- **filled** (default): `filled-field` container, `text-medium` bottom line that becomes a 2px `primary` line on focus.
- **outlined**: `outline` border, `text-high` on hover, 2px `primary` on focus. The rest-state border is 2.7:1 on white (Material's value); the label and focus changes carry the state.
- The label floats to 12px when focused or filled; never replace it with a placeholder.
- Error: set `error` and put the reason in `helperText` (`caption` style, `error` colour). The text, not the colour, carries the message.
