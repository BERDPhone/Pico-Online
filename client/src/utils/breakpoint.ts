import { EditorView, gutter, GutterMarker } from "@codemirror/view"
import { StateField, StateEffect, RangeSet } from "@codemirror/state"

const breakpointEffect = StateEffect.define<{pos: number, on: boolean}>({
	map: (val, mapping) => ({pos: mapping.mapPos(val.pos), on: val.on})
})


const breakpointState = StateField.define<RangeSet<GutterMarker>>({
	create() { return RangeSet.empty },
	update(set, transaction) {
		set = set.map(transaction.changes)
		for (let e of transaction.effects) {
			if (e.is(breakpointEffect)) {
				if (e.value.on)
					set = set.update({add: [breakpointMarker.range(e.value.pos)]})
				else
					set = set.update({filter: from => from !== e.value.pos})
			}
		}
		return set
	}
})

function toggleBreakpoint(view: EditorView, pos: number) {
	let breakpoints = view.state.field(breakpointState)
	let hasBreakpoint = false
	breakpoints.between(pos, pos, () => {hasBreakpoint = true})
	view.dispatch({
		effects: breakpointEffect.of({pos, on: !hasBreakpoint})
	})
}

// eslint-disable-next-line
const breakpointMarker = new class extends GutterMarker {
	toDOM() { return document.createTextNode("⬤") }
}

export const breakpointGutter = [
	breakpointState,
	gutter({
		class: "cm-breakpoint-gutter",
		markers: v => v.state.field(breakpointState),
		initialSpacer: () => breakpointMarker,
		domEventHandlers: {
			mousedown(view, line) {
				toggleBreakpoint(view, line.from)
				return true
			}
		}
	}),
	EditorView.baseTheme({
		".cm-breakpoint-gutter .cm-gutterElement": {
			color: "#B31D00",
			paddingLeft: "5px",
			cursor: "default"
		}
	})
]
