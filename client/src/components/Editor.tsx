import React, { Component } from "react";
import { Resizable } from 're-resizable';

import FileExplorerParent from './FileExplorerParent'

import { PullContext } from "../context/PullContext";
import { Socket } from "socket.io-client";
import CodeMirrorParent from "./CodeMirrorParent";

type props = {
	socket: Socket,
	terminal: any
}


class Editor extends Component<props> {

	static contextType = PullContext;

	render() {

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
					<FileExplorerParent socket={this.props.socket} terminal={this.props.terminal} />
				</Resizable>

				<CodeMirrorParent socket={this.props.socket} />
			</div>
		);
	}
}

export default Editor;