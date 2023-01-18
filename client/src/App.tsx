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
import Toggle from './components/Toggle';

const socket = io(new URL(process.env.REACT_APP_API_URL!).origin, {
	path: "/api"
});

let NavbarKey = 0;

type props = {};

type state = {
	connected: boolean,
}

class App extends Component<props, state> {
	terminal: any = React.createRef();

	state = {
		connected: false,
	}

	componentDidMount() {
		socket.on('connect', () => {
			this.setState({
				connected: true
			});
		});

		socket.on('disconnect', () => {
			this.setState({ 
				connected: false
			});
		});

		socket.on("clear", () => {
			this.terminal.current.clearInput();
			this.terminal.current.terminalInput.current.value = "clear";
			this.terminal.current.processCommand();
			this.terminal.current.scrollToBottom();
		})

		socket.on("command", (commandName) => {
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
			this.terminal.current.scrollToBottom();
		})

		// socket.on("initPull", ())

		socket.on("stdout", (out) => {
			this.terminal.current.pushToStdout(out)
			this.terminal.current.scrollToBottom();
		})

		socket.on("branch", (out: string) => {
			const commandName = `branch ${out}`
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
			this.terminal.current.scrollToBottom();
		})

		socket.on('pullFinish', () => {
			socket.emit("getStructure");
		})

		socket.on('target', (out) => {
			const commandName = `target ${out[0]} ${out[1]}`
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
			this.terminal.current.scrollToBottom();
		})

		socket.emit("getBranch");
		socket.emit("getStructure");
	}

	componentWillUnmount() {
		socket.off('connect');
		socket.off('disconnect');
		socket.off('clear');
		socket.off('command');
		socket.off('stdout');
		socket.off('branch');
		socket.off('displayBranch');
		socket.off('getBranch')
		socket.off('getStructure')
		socket.off('pullFinish');
		socket.off('target');
	}

	commands = {
		pull: {
			description: 'Does a git pull to update the current repository.',
			fn: (args: string) => {
				socket.emit("pull", args);
			}
		},
		branch: {
			description: 'Lists all branches if no arguement supplied, switches branch if arguement provided.',
			fn: (args: string) => {
				socket.emit("branch", args);
				socket.emit("getStructure");
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
				socket.emit("getStructure");
			}
		},
		target: {
			description: `Changes the build target. Usage: 'target executable_name path_to_executable'`,
			fn: (arg: string, arg2: string) => {
				socket.emit("changeTarget", [arg, arg2]);
			}
		},
		save: {
			description: 'Saves all files on the server. Remember to save before building!',
			fn: () => {
				socket.emit("save")
			}
		}

	}

	render() {
		return (
			<PullProvider>
				<div className="flex flex-col">
					<Navbar socket={socket} terminal={this.terminal} />

					<Editor key={NavbarKey += 1} socket={socket} terminal={this.terminal} />

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
						<Toggle socket={socket} terminal={this.terminal} />
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
