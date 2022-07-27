import React from "react";
import { Resizable } from 're-resizable';

import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { sublime } from '@uiw/codemirror-theme-sublime';
import {EditorView, gutter, GutterMarker} from "@codemirror/view"
import {StateField, StateEffect, RangeSet} from "@codemirror/state"
import { basicSetup, minimalSetup } from '@uiw/codemirror-extensions-basic-setup';
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight';

import FileExplorer from './FileExplorer'

function Editor() {
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
						set = set.update({filter: from => from != e.value.pos})
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

	const breakpointMarker = new class extends GutterMarker {
		toDOM() { return document.createTextNode("⬤") }
	}

	const breakpointGutter = [
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

	let sublimeLike = createTheme({
		theme: 'dark',
		settings: {
			background: '#303841',
			foreground: '#FFFFFF',
			caret: '#FBAC52',
			selection: '#4C5964',
			selectionMatch: '#3A546E',
			gutterBackground: '#1B2129',
			gutterForeground: '#FFFFFF90',
			lineHighlight: '#00000059',
		},
		styles: [
			{ tag: [t.meta, t.comment], color: '#A2A9B5' },
			{ tag: [t.attributeName, t.keyword], color: '#B78FBA' },
			{ tag: t.function(t.variableName), color: '#5AB0B0' },
			{ tag: [t.string, t.regexp, t.attributeValue], color: '#99C592' },
			{ tag: t.operator, color: '#f47954' },
			// { tag: t.moduleKeyword, color: 'red' },
			{ tag: [t.propertyName, t.typeName], color: '#629ccd' },
			{ tag: [t.tagName, t.modifier], color: '#E35F63' },
			{ tag: [t.number, t.definition(t.tagName), t.className, t.definition(t.variableName)], color: '#fbac52' },
			{ tag: [t.atom, t.bool, t.special(t.variableName)], color: '#E35F63' },
		],
	});

	return (
		<div className="flex h-full overflow-hidden">

			<Resizable
				className="overflow-scroll bg-gray-800"
				// style={style}
				defaultSize={{
					width: '200px',
					height: '100%',
				}}
				maxWidth="100%"
				minWidth="1"
			>
				<FileExplorer files={files}/>
			</Resizable>

			<CodeMirror
				className="flex-1 overflow-scroll"
				value="console.log('hello world!');"
				theme={sublimeLike}
				height="100%"
				basicSetup={false}
				extensions={[breakpointGutter, basicSetup(), langs.c()]}
			/>
		</div>
	);
}


const files = {"name":"BDOS","type":"folder","children":[{"type":"file","name":".gitignore"},{"type":"file","name":"LICENSE"},{"type":"file","name":"README.md"},{"type":"file","name":"CMakeLists.txt"},{"type":"file","name":"pico_sdk_import.cmake"},{"type":"file","name":"style.md"},{"name":"bin","type":"folder","children":[{"type":"file","name":"README.md"}]},{"name":"build","type":"folder","children":[{"type":"file","name":"README.md"}]},{"name":"practice","type":"folder","children":[{"type":"file","name":"CMakeLists.txt"},{"type":"file","name":"arm_practice.s"}]},{"name":"src","type":"folder","children":[{"type":"file","name":"CMakeLists.txt"},{"name":"programs","type":"folder","children":[{"name":"core","type":"folder","children":[{"type":"file","name":"login.c"},{"name":"headers","type":"folder","children":[{"type":"file","name":"login.h"}]}]},{"name":"essential","type":"folder","children":[{"type":"file","name":"login.c"},{"name":"headers","type":"folder","children":[{"type":"file","name":"login.h"}]}]}]},{"name":"os","type":"folder","children":[{"type":"file","name":"CMakeLists.txt"},{"type":"file","name":"boot.h"},{"type":"file","name":"boot.c"},{"name":"kernel","type":"folder","children":[{"type":"file","name":"CMakeLists.txt"},{"type":"file","name":"context_switch.s"},{"type":"file","name":"kernel.h"},{"type":"file","name":"kernel.c"}]},{"name":"api","type":"folder","children":[{"type":"file","name":"CMakeLists.txt"},{"type":"file","name":"api.c"},{"name":"headers","type":"folder","children":[{"type":"file","name":"api.h"}]}]},{"name":"drivers","type":"folder","children":[{"type":"file","name":"ILI9488.c"},{"type":"file","name":"CMakeLists.txt"},{"name":"headers","type":"folder","children":[{"type":"file","name":"ILI9488.h"}]}]},{"name":"helpers","type":"folder","children":[{"type":"file","name":"TFT.c"},{"type":"file","name":"CMakeLists.txt"},{"name":"headers","type":"folder","children":[{"type":"file","name":"TFT.h"}]}]}]}]},{"name":".git","type":"folder","children":[{"type":"file","name":"HEAD"},{"type":"file","name":"config"},{"type":"file","name":"description"},{"type":"file","name":"index"},{"type":"file","name":"packed-refs"},{"name":"hooks","type":"folder","children":[{"type":"file","name":"applypatch-msg.sample"},{"type":"file","name":"commit-msg.sample"},{"type":"file","name":"fsmonitor-watchman.sample"},{"type":"file","name":"pre-applypatch.sample"},{"type":"file","name":"post-update.sample"},{"type":"file","name":"pre-commit.sample"},{"type":"file","name":"pre-merge-commit.sample"},{"type":"file","name":"pre-push.sample"},{"type":"file","name":"pre-rebase.sample"},{"type":"file","name":"pre-receive.sample"},{"type":"file","name":"prepare-commit-msg.sample"},{"type":"file","name":"push-to-checkout.sample"},{"type":"file","name":"update.sample"}]},{"name":"info","type":"folder","children":[{"type":"file","name":"exclude"}]},{"name":"objects","type":"folder","children":[{"name":"info","type":"folder","children":{"name":"info","type":"folder","children":[]}},{"name":"pack","type":"folder","children":[{"type":"file","name":"pack-cc7ef753c50ec43fddedf49eaeeaf4e022679383.idx"},{"type":"file","name":"pack-cc7ef753c50ec43fddedf49eaeeaf4e022679383.pack"}]}]},{"name":"refs","type":"folder","children":[{"name":"tags","type":"folder","children":{"name":"tags","type":"folder","children":[]}},{"name":"heads","type":"folder","children":[{"type":"file","name":"main"}]},{"name":"remotes","type":"folder","children":[{"name":"origin","type":"folder","children":[{"type":"file","name":"HEAD"}]}]}]},{"name":"logs","type":"folder","children":[{"type":"file","name":"HEAD"},{"name":"refs","type":"folder","children":[{"name":"heads","type":"folder","children":[{"type":"file","name":"main"}]},{"name":"remotes","type":"folder","children":[{"name":"origin","type":"folder","children":[{"type":"file","name":"HEAD"}]}]}]}]}]}],"status":200}

export default Editor;