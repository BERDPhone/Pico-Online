import React, { Component } from "react";
import { Socket } from "socket.io-client";

import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import {EditorView, gutter, GutterMarker, ViewPlugin} from "@codemirror/view"
import {StateField, StateEffect, RangeSet, EditorState} from "@codemirror/state"
import { basicSetup } from '@uiw/codemirror-extensions-basic-setup';
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight';
import { indentUnit } from '@codemirror/language'

type props = {
	socket: Socket
}

type state = {
	fileContents: string,
	fileFullPath: string,
	fileRelativePath: string,
	update: boolean
}

let fileExplorerKey = 0;

class CodeMirrorParent extends Component<props, state> {

	state = {
		fileContents: "Select file to start editing.",
		fileFullPath: "none",
		fileRelativePath: "none",
		update: true
	}

	increaseFileExplorerKey = () => {
		return fileExplorerKey +=1;
	}

	componentDidMount() {
		this.props.socket.on('fileContents', (out: string) => {
			this.setState({
				fileContents: out,
				update: false,
			})
		})

		this.props.socket.on('filePath', (full: string, relative: string) => {
			this.setState({
				fileFullPath: full,
				fileRelativePath: relative
			})
		})

		this.props.socket.on('fileUpdated', (path: string, doc: string) => {
			console.log(path, this.state.fileFullPath);
			// console.log(path, this.state.filePath);
			if (path === this.state.fileFullPath) {
				this.setState({ 
					fileContents: doc
				});
			}
		})

		this.props.socket.on('pullFinish', () => {
			this.props.socket.emit('updateContents', this.state.fileRelativePath)
		})

	}

	componentWillUnmount() {
		this.props.socket.off('fileContents');
		this.props.socket.off('filePath');
		this.props.socket.off('fileUpdated');
		this.props.socket.off('pullFinish');
	}

	render() {

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

		return (
			<CodeMirror
				className="flex-1 overflow-scroll"
				theme={sublimeLike}
				height="100%"
				basicSetup={false}
				id="codeEditor"
				extensions={[
					indentUnit.of("\t"), 
					breakpointGutter, 
					basicSetup(), 
					langs.c(),
				]}
				onChange={(value, viewUpdate) => {
					// console.log(value)
					// console.log(viewUpdate)
					if (this.state.update === true) {
						if (this.state.fileFullPath !== "none") {
							this.props.socket.emit('docChanged', this.state.fileFullPath, value);
						}
					} else {
						this.setState({
							update: true
						})
					}
				}}
				value={this.state.fileContents}
			/>
		);
	}
}

export default CodeMirrorParent;