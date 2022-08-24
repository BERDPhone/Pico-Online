import React, { Component } from "react";
import { Socket } from "socket.io-client";

import FileExplorer, {FileStruct} from './FileExplorer'

type props = {
	socket: Socket,
	terminal: any
}

type state = {
	files?: FileStruct,
}

let fileExplorerKey = 0;

class Editor extends Component<props, state> {

	state = {
		files: {
			name: "loading",
			type: "folder"
		}
	}

	increaseFileExplorerKey = () => {
		return fileExplorerKey +=1;
	}

	componentDidMount() {
		this.props.socket.on('filestruct', (out: FileStruct) => {
			this.setState({
				files: out
			})
		})

		this.props.socket.emit('getStructure');
	}

	componentWillUnmount() {
		this.props.socket.off('filestruct');
		this.props.socket.off('getStructure');
	}

	render() {

		this.increaseFileExplorerKey();

		return (
			<>
				<FileExplorer increaseKey={this.increaseFileExplorerKey} files={this.state.files} key={fileExplorerKey} terminal={this.props.terminal} socket={this.props.socket} filepath="" />
			</>
		);
	}
}

export default Editor;