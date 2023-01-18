import { Component } from "react";
import { Socket } from "socket.io-client";

import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { basicSetup } from '@uiw/codemirror-extensions-basic-setup';
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight';
import { indentUnit } from '@codemirror/language'

import { peerExtension, getDocument } from "../utils/collab";
import { cursorExtension } from "../utils/cursors"

import { breakpointGutter } from "../utils/breakpoint";

import { generateName } from "../utils/usernames";

type props = {
	socket: Socket,
}

type state = {
	connected: boolean,
	version: number | null,
	file: string,
	doc: string | null
}

let fileExplorerKey = 0;

class CodeMirrorParent extends Component<props, state> {

	state = {
		connected: false,
		version: null,
		doc: null,
		file: '',
		username: generateName()
	}

	increaseFileExplorerKey = () => {
		return fileExplorerKey +=1;
	}

	async componentDidMount() {
		const { version, doc } = await getDocument(this.props.socket, this.state.file);

		this.setState({
			version,
			doc: doc.toString()
		})

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

		this.props.socket.on('display', async (file) => {
			const { version, doc } = await getDocument(this.props.socket, file)

			this.setState({
				version,
				doc: doc.toString(),
				file
			})
		});
	}

	componentWillUnmount() {
		this.props.socket.off('display');
		this.props.socket.off('pullUpdateResponse');
		this.props.socket.off('pushUpdateResponse');
		this.props.socket.off('getDocumentResponse');
	}

	render() {
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
				<CodeMirror
					key={fileExplorerKey}
					className="flex-1 overflow-scroll"
					theme={sublimeLike}
					height="100%"
					basicSetup={false}
					extensions={[
						indentUnit.of("\t"),
						breakpointGutter,
						basicSetup(), 
						langs.c(),
						peerExtension(this.props.socket, this.state.file, this.state.version, this.state.username),
						cursorExtension(this.state.username)
					]}
					value={this.state.doc}
				/>
			);
		} else {
			return (
				<p>loading...</p>
			);
		}
	}
}

export default CodeMirrorParent;
