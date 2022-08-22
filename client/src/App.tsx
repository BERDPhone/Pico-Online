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

console.log("process.env.REACT_APP_API_URL!: ", process.env.REACT_APP_API_URL!);

const socket = io(new URL(process.env.REACT_APP_API_URL!).origin);

let NavbarKey = 0;

type props = {};

type state = {
	connected: boolean,
	lastPong: null | string
}

class App extends Component<props, state> {
	terminal: any = React.createRef();

	state = {
		connected: false,
		lastPong: null
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

		socket.on('pong', () => {
			console.log("recieved pong");
			this.setState({ 
				lastPong: new Date().toISOString()
			});
		});

		socket.on("clear", () => {
			console.log("recieved clear");
			this.terminal.current.clearInput();
			this.terminal.current.terminalInput.current.value = "clear";
			this.terminal.current.processCommand();
		})

		socket.on("pull", (gitUrl) => {
			console.log("recieved pull");
			const commandName = "pull"
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
		})

		socket.on("stdout", (out) => {
			console.log("recieving stdout");
			console.log("out: ", out);
			this.terminal.current.pushToStdout(out)
		})

		socket.on("branch", () => {
			console.log("recieving branch");
			const commandName = "branch"
			this.terminal.current.pushToHistory(commandName)
			this.terminal.current.pushToStdout(constructEcho(this.terminal.current.props.promptLabel || '$', commandName, this.terminal.current.props), { isEcho: true })
		})
	}

	componentWillUnmount() {
		socket.off('connect');
		socket.off('disconnect');
		socket.off('pong');
		socket.off('clear');
		socket.off('pull');
		socket.off('stdout');
		socket.off('branch');
	}

	sendPing = () => {
		console.log("sending ping...")
		socket.emit('ping');
	}


	commands = {
		wait: {
			description: 'Waits one second and sends a message.',
			fn: () => {
				const terminal = this.terminal.current
				setTimeout(() => terminal.pushToStdout('Hello after 1 second!'), 1500)
				return 'Running, please wait...'
			}
		},
		pull: {
			description: 'Does a git pull to update the current repository',
			fn: () => {
				socket.emit("pull");
			}
		},
		branch: {
			description: 'Lists all branches if no arguement supplied, switches branch if arguement provided',
			fn: (args: string) => {
				socket.emit("branch", args);
			}
		}

	}

	render() {
		return (
			<PullProvider>
				<div className="flex flex-col">
					<Navbar socket={socket} terminal={this.terminal.current} />

					<Editor key={NavbarKey += 1} />

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
