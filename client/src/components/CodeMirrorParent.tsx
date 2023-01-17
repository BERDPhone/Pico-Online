import React, { Component } from "react";
import { Socket } from "socket.io-client";

import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { EditorView, gutter, GutterMarker, ViewPlugin, ViewUpdate, Decoration, DecorationSet, Tooltip, showTooltip, WidgetType } from "@codemirror/view"
import { StateField, StateEffect, RangeSet, EditorState, Text, ChangeSet, EditorSelection, Extension, StateEffectType, RangeSetBuilder } from "@codemirror/state"
import { Update, receiveUpdates, sendableUpdates, collab, getSyncedVersion } from "@codemirror/collab"
import { basicSetup } from '@uiw/codemirror-extensions-basic-setup';
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight';
import { indentUnit } from '@codemirror/language'
import { markdown } from "@codemirror/lang-markdown";

import { cursor, Cursors, addCursor, removeCursor, cursorExtension } from "../utils/cursors";

type props = {
	socket: Socket
}

type state = {
	connected: boolean,
	version: number | null,
	doc: String | null,
	fileContents: string,
	cursors: cursor[]
}

let fileExplorerKey = 0;

class CodeMirrorParent extends Component<props, state> {

	state = {
		fileContents: "Select file to start editing.",
		connected: false,
		version: null,
		doc: null,
		cursors: []
	}

	increaseFileExplorerKey = () => {
		return fileExplorerKey +=1;
	}

	componentDidMount() {
		this.props.socket.on('fileContents', (out: string) => {
			this.setState({
				fileContents: out
			})
		})

		this.getDocument().then(({version, doc}) => {
			this.setState({
				version,
				doc: doc.toString()
			});
		});

		this.props.socket.on('connect', () => {
			this.setState({
				connected: true
			});
		});

		this.props.socket.on('disconnect', () => {
			this.setState({ 
				connected: false
			});
		});
	}

	componentWillUnmount() {
		this.props.socket.off('fileContents');
		this.props.socket.off('pullUpdateResponse');
		this.props.socket.off('pushUpdateResponse');
		this.props.socket.off('getDocumentResponse');
	}

	pushUpdates(
		version: number,
		fullUpdates: readonly Update[]
	): Promise<boolean> {
		// Strip off transaction data
		let updates = fullUpdates.map(u => ({
			clientID: u.clientID,
			changes: u.changes.toJSON(),
			effects: u.effects
		}))

		const socket = this.props.socket;

		return new Promise(function(resolve) {
			socket.emit('pushUpdates', version, JSON.stringify(updates));

			socket.once('pushUpdateResponse', function(status: boolean) {
				resolve(status);
			});
		});
	}

	pullUpdates(
		version: number
	): Promise<readonly Update[]> {
		const socket = this.props.socket;

		return new Promise(function(resolve) {
			socket.emit('pullUpdates', version);

			socket.once('pullUpdateResponse', function(updates: any) {
				resolve(JSON.parse(updates));
			});
		}).then((updates: any) => updates.map((u: any) => {
			if (u.effects[0]) {
				let effects: StateEffect<any>[] = [];

				u.effects.forEach((effect: StateEffect<any>) => {
					if (u.effects?.id) {
						let cursor: cursor = {
							id: u.effects.id,
							from: u.effects.from,
							to: u.effects.to
						}

						effects.push(addCursor.of(cursor))
					}
				})

				return {
					changes: ChangeSet.fromJSON(u.changes),
					clientID: u.clientID,
					effects: effects
				}
			}
			
			return {
				changes: ChangeSet.fromJSON(u.changes),
				clientID: u.clientID
			}
		}));
	}

	getDocument(): Promise<{version: number, doc: Text}> {
		const socket = this.props.socket;

		return new Promise(function(resolve) {
			socket.emit('getDocument');

			socket.once('getDocumentResponse', function(version: number, doc: string) {
				resolve({
					version,
					doc: Text.of(doc.split("\n"))
				});
			});
		});
	}

	render() {
		let self = this;

		const peerExtension = (startVersion: number) => {
			let plugin = ViewPlugin.fromClass(class {
				private pushing = false
				private done = false

				constructor(private view: EditorView) { this.pull() }

				update(update: ViewUpdate) {
					if (update.docChanged || update.transactions[0]?.effects[0]) this.push()
				}

				async push() {
					let updates = sendableUpdates(this.view.state);
					if (this.pushing || !updates.length) return;
					this.pushing = true;
					let version = getSyncedVersion(this.view.state);
					let success = await self.pushUpdates(version, updates);
					this.pushing = false;
					// Regardless of whether the push failed or new updates came in
					// while it was running, try again if there's updates remaining
					if (sendableUpdates(this.view.state).length)
						setTimeout(() => this.push(), 100);
				}

				async pull() {
					while (!this.done) {
						let version = getSyncedVersion(this.view.state)
						let updates = await self.pullUpdates(version)
						let newUpdates = receiveUpdates(this.view.state, updates)
						this.view.dispatch(newUpdates)
					}
				}

				destroy() { this.done = true }
			})

			return [
				collab({
					startVersion,
					sharedEffects: tr => {
						const effects = tr.effects.filter(e => {
							return e.is(addCursor)
						})

						return effects;
					}
				}),
				plugin
			]
		}

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

		this.increaseFileExplorerKey();

		if (this.state.version !== null && this.state.doc !== null) {
			return (
				<>
					<CodeMirror
						className="flex-1 overflow-scroll"
						theme={sublimeLike}
						height="100%"
						basicSetup={false}
						extensions={[
							indentUnit.of("\t"),
							breakpointGutter,
							basicSetup(), 
							langs.c(),
							peerExtension(this.state.version),
							EditorView.updateListener.of(update => {
								update.transactions.forEach(e => { 
									if (e.selection) {
										let cursor: cursor = {
											id: "abc",
											from: e.selection.ranges[0].from,
											to: e.selection.ranges[0].to
										}
										update.view.dispatch({
											effects: addCursor.of(cursor)
										})
									}
								})
							}),
							cursorExtension
						]}
						value={this.state.doc}
					/>
				</>
			);
		} else {
			return (
				<span>loading...</span>
			)
		}
	}
}

export default CodeMirrorParent;
