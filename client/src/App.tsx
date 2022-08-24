import React, {Component} from 'react';
import { Resizable } from 're-resizable';
import { io } from "socket.io-client";

import Navbar from './components/Navbar';
import Editor from './components/Editor';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Terminal from 'react-console-emulator';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import constructEcho from 'react-console-emulator/dist/utils/constructEcho';
import "./App.css";
import { PullProvider } from './context/PullContext';

const socket = io(new URL(process.env.REACT_APP_API_URL!).origin, {
	path: "/api"
});

let NavbarKey = 0;

type props = {};

type state = {
	connected: boolean,
	branch: string,
	fileContents: string,
	filestruct: object,
}

class App extends Component<props, state> {
	terminal: any = React.createRef();

	state = {
		connected: false,
		branch: "main",
		fileContents: "Select file to start editing",
		filestruct: {
			"name": "loading",
			"type": "folder",
			"children": [],
			"status": 500,
		}
	}

	componentDidMount() {
		socket.on('connect', () => {
			console.log("connected");
			this.setState({
				connected: true
			});
		});

		socket.on('disconnect', () => {
			console.log("disconnected");
			this.setState({ 
				connected: false
			});
		});

		socket.on("clear", () => {
			console.log("recieved clear");
			this.terminal.current.clearInput();
			this.terminal.current.terminalInput.current.value = "clear";
			this.terminal.current.processCommand();
			this.terminal.current.scrollToBottom();
		})

		socket.on("pull", (gitUrl) => {
			console.log("recieved pull");
			const commandName = "pull"
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
			this.terminal.current.scrollToBottom();
		})

		socket.on("stdout", (out) => {
			console.log("recieving stdout");
			this.terminal.current.pushToStdout(out)
			this.terminal.current.scrollToBottom();
		})

		socket.on("branch", (out: string) => {
			const commandName = "branch"
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
			this.terminal.current.scrollToBottom();
		})

		socket.on('displayBranch', (out: string) => {
			console.log(`changing branch in dropdown to ${out}`)
			this.setState({
				"branch": out
			});
		})

		socket.on('filestruct', (out: object) => {
			console.log(`Updating the file structure: ${out}`)
			this.setState({
				"filestruct": out
			});
		})

		socket.on('fileContents', (out: string) => {
			console.log(`changing eidtor's fileContents`)
			this.setState({
				"fileContents": out
			});

			console.log(this.state);

		})

		socket.emit("getBranch");
		socket.emit("getStructure");
	}

	componentWillUnmount() {
		socket.off('connect');
		socket.off('disconnect');
		socket.off('clear');
		socket.off('pull');
		socket.off('stdout');
		socket.off('branch');
		socket.off('fileContents');
		socket.off('displayBranch');
		socket.off('filestruct');
		socket.off('getBranch')
		socket.off('getStructure')
	}

	shouldComponentUpdate(nextProps: props, nextState: state) {
		// if (nextState.filestruct !== this.state.filestruct) return true;
		return true;
	}


	commands = {
		pull: {
			description: 'Does a git pull to update the current repository.',
			fn: () => {
				socket.emit("pull");
			}
		},
		branch: {
			description: 'Lists all branches if no arguement supplied, switches branch if arguement provided.',
			fn: (args: string) => {
				socket.emit("branch", args);
			}
		},
		build: {
			description: 'Build and runs the code on the raspberry pi pico.',
			fn: (args: string) => {
				socket.emit("build", args);
			}
		},
		edit: {
			description: 'Alows you to edit a file in the editor.',
			fn: (args: string) => {
				socket.emit("edit", args);
			}
		},
		structure: {
			description: 'Updates the file structure in the file manager.',
			fn: (args: string) => {
				socket.emit("filestruct");
			}
		}

	}

	render() {
		return (
			<PullProvider>
				<div className="flex flex-col">
					<Navbar socket={socket} terminal={this.terminal.current} branch={this.state.branch} />

					<Editor key={NavbarKey += 1} fileContents={this.state.fileContents} fileStruct={this.state.filestruct} />

					<Resizable
						className="bg-current "
						// style={style}
						defaultSize={{
							width: '100%',
							height: '200px',
						}}
						maxWidth="100%"
						minWidth="1"
						enable={ { top:true, right:false, bottom:false, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false } }

					>
							<Terminal
								style={{minHeight: "0px"}}
								className="h-full"
								promptLabelStyle={{paddingTop: "0px"}}
								ref={this.terminal} // Assign ref to the terminal here
								commands={this.commands}
							/>
					</Resizable>
				</div>
			</PullProvider>
		);
	}
}

export default App;
