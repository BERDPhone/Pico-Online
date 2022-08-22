import React, { Component } from "react";
import { Resizable } from 're-resizable';

import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import {EditorView, gutter, GutterMarker} from "@codemirror/view"
import {StateField, StateEffect, RangeSet} from "@codemirror/state"
import { basicSetup } from '@uiw/codemirror-extensions-basic-setup';
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight';

import FileExplorer, {FileStruct} from './FileExplorer'

import { PullContext } from "../context/PullContext";

let fileExplorerKey = 0;

class Editor extends Component {
	fileData: FileStruct = { name: "BDOS", type: "folder" };

	static contextType = PullContext;

	state = {
		files: this.fileData
	};

	increaseFileExplorerKey = () => {
		return fileExplorerKey +=1;
	}
	

	async componentDidMount() {
		await fetch(`${process.env.REACT_APP_API_URL}/files/structure`, {
			method: 'GET'
		})
			.then((response) => response.json())
			.then((data: FileStruct) => {
				if (data.status === 200) {
					this.setState({files: data});
				}
			});
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

					enable={ { top:false, right:true, bottom:false, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false } }
					// minHeight="100%"
				>
					{
						((Object.keys(this.state.files).length === 0) || this.context) ? 
							<FileExplorer 
								loading={true} 
								key={fileExplorerKey} 
								increaseKey={this.increaseFileExplorerKey}
							/> : 

							<FileExplorer 
								files={this.state.files} 
								loading={false} 
								key={fileExplorerKey} 
								increaseKey={this.increaseFileExplorerKey}
							/> 
					}
				</Resizable>

				{
					this.context ?
						<CodeMirror
							className="backdrop-blur-sm bg-white/30 flex-1 overflow-scroll"
							value="console.log('hello world!');"
							theme={sublimeLike}
							height="100%"
							basicSetup={false}
							extensions={[EditorView.contentAttributes.of({ contenteditable: 'false' }), breakpointGutter, basicSetup(), langs.c()]}
						/>
					: <CodeMirror
							className="flex-1 overflow-scroll"
							value="console.log('hello world!');"
							theme={sublimeLike}
							height="100%"
							basicSetup={false}
							extensions={[breakpointGutter, basicSetup(), langs.c()]}
						/>
				}
			</div>
		);
	}
}

export default Editor;