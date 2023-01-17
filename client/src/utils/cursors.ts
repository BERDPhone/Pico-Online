import { EditorView, ViewPlugin, Decoration, DecorationSet, WidgetType } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"
import { getClientID } from "@codemirror/collab"

export interface cursor {
	id: string,
	from: number,
	to: number
}

export interface Cursors {
	cursors: cursor[]
}

let clientId = "";

class TooltipWidget extends WidgetType {
	private name: string = "John";
	private suffix: string = "1";

	constructor(name: string, suffix: string) {
		super();
		this.suffix = suffix;
		this.name = name;
	}

	toDOM() {
		let dom = document.createElement("div");
		dom.className = "cm-tooltip-none";

		let cursor_tooltip = document.createElement("div");
		cursor_tooltip.className = `cm-tooltip-cursor cm-tooltip cm-tooltip-above cm-tooltip-${this.suffix}`;
		cursor_tooltip.textContent = this.name;

		let cursor_tooltip_arrow = document.createElement("div");
		cursor_tooltip_arrow.className = "cm-tooltip-arrow";

		cursor_tooltip.appendChild(cursor_tooltip_arrow);
		dom.appendChild(cursor_tooltip);
		return dom
	}

	ignoreEvent() { return false }
}

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

			if (!clientId) clientId = getClientID(tr.startState)

			if (e.value.from != e.value.to) {
				addUpdates.push(Decoration.mark({
					class: "cm-highlight-1",
					id: e.value.id
				}).range(e.value.from, e.value.to));
			}

			addUpdates.push(
				Decoration.widget({
					widget: new TooltipWidget(clientId, "1"),
					block: false,
					side: -1,
					id: e.value.id
				}).range(e.value.to, e.value.to)
			);

			cursorTransacions = cursorTransacions.update({
				add: addUpdates,
				filter: (from, to, value ) => {
					if (value?.spec?.id == e.value.id) return false;
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
		color: "white",
		border: "none",
		padding: "2px 7px",
		borderRadius: "4px",
		position: "absolute",
		marginTop: "-40px",
		marginLeft: "-14px",
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#66b"
		},
		"& .cm-tooltip-arrow:after": {
			borderTopColor: "transparent"
		},
		zIndex: "1000000"
	},
	".cm-tooltip-none": {
		width: "0px",
		height: "0px",
		display: "inline-block",
	},
	".cm-highlight-1": {
		backgroundColor: "#6666BB55"
	},
	".cm-tooltip-1": {
		backgroundColor: "#66b !important",
		"& .cm-tooltip-arrow:before": {
			borderTopColor: "#66b !important"
		},
	}
})

export function cursorExtension(id: string = "") {
	clientId = id;
	return [cursorField, cursorBaseTheme];
}
