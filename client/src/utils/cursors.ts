import { EditorView, ViewPlugin, Decoration, DecorationSet, WidgetType } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"

export interface cursor {
	id: string,
	from: number,
	to: number
}

export interface Cursors {
	cursors: cursor[]
}

class TooltipWidget extends WidgetType {
	constructor() { super() }

	toDOM() {
		let dom = document.createElement("div")
		dom.className = "cm-tooltip"

		let cursor_tooltip = document.createElement("div");
		cursor_tooltip.className = "cm-tooltip-cursor"
		cursor_tooltip.textContent = "Jimmy"

		dom.appendChild(cursor_tooltip);
		return dom
	}

	ignoreEvent() { return false }
}

const highlight = Decoration.mark({class: "cm-highlight"})

export const addCursor = StateEffect.define<cursor>();
export const removeCursor = StateEffect.define<String>();

const cursorField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none
	},
	update(cursors, tr) {
		cursors = cursors.map(tr.changes)
		for (let e of tr.effects) if (e.is(addCursor)) {
			let addUpdates = [];

			if (e.value.from != e.value.to) {
				addUpdates.push(highlight.range(e.value.from, e.value.to));
			}

			addUpdates.push(
				Decoration.widget({
					widget: new TooltipWidget()
				}).range(e.value.to, e.value.to)
			);

			cursors = cursors.update({
				add: addUpdates
			})
		} else if (e.is(removeCursor)) {
			cursors = cursors.update({
				filter: (from, to, value) => {
					console.log(value)
					return true;
				}
			})
		}

		return cursors
	},
	provide: f => EditorView.decorations.from(f)
})


const cursorBaseTheme = EditorView.baseTheme({
	".cm-tooltip.cm-tooltip-cursor": {
		backgroundColor: "#66b",
		color: "white",
		border: "none",
		padding: "2px 7px",
		borderRadius: "4px",
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#66b"
		},
		"& .cm-tooltip-arrow:after": {
			borderTopColor: "transparent"
		}
	}
})

export const cursorExtension = [cursorField, cursorBaseTheme]
