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

let clientId = "-1";

class TooltipWidget extends WidgetType {
	constructor() { super() }

	toDOM() {
		let dom = document.createElement("div");
		dom.className = "cm-tooltip-none";

		let cursor_tooltip = document.createElement("div");
		cursor_tooltip.className = "cm-tooltip-cursor cm-tooltip cm-tooltip-above"
		cursor_tooltip.textContent = "Jimmy"

		let cursor_tooltip_arrow = document.createElement("div");
		cursor_tooltip_arrow.className = "cm-tooltip-arrow"

		cursor_tooltip.appendChild(cursor_tooltip_arrow);
		dom.appendChild(cursor_tooltip);
		return dom
	}

	ignoreEvent() { return false }
}

const highlight = Decoration.mark({
	class: "cm-highlight",
})

export const addCursor = StateEffect.define<cursor>();
export const removeCursor = StateEffect.define<String>();

const cursorField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none
	},
	update(cursors, tr) {
		let cursorTransacions = cursors.map(tr.changes)
		for (let e of tr.effects) if (e.is(addCursor)) {
			let addUpdates = [];

			if (e.value.from != e.value.to) {
				addUpdates.push(highlight.range(e.value.from, e.value.to));
			}

			addUpdates.push(
				Decoration.widget({
					widget: new TooltipWidget(),
					block: false,
					side: -1,
					id: clientId
				}).range(e.value.to, e.value.to)
			);

			cursorTransacions = cursorTransacions.update({
				add: addUpdates
			})
		} else if (e.is(removeCursor)) {
			cursorTransacions = cursorTransacions.update({
				filter: (from, to, value ) => {
					console.log(value)
					if (value?.spec?.id == clientId) return false;
					return true;
				}
			})
		}

		return cursorTransacions
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
		position: "fixed",
		marginTop: "-40px",
		marginLeft: "-14px",
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#66b"
		},
		"& .cm-tooltip-arrow:after": {
			borderTopColor: "transparent"
		}
	},
	".cm-tooltip-none": {
		width: "0px",
		height: "0px",
		display: "inline-block"
	}
})

export function cursorExtension(id: string) {
	clientId = id;
	highlight.spec.id = clientId;
	return [cursorField, cursorBaseTheme];
}
