import React, {Component} from 'react';
import { Resizable } from 're-resizable';
import { ReactTerminal } from "react-terminal";

import Navbar from './components/Navbar';
import Editor from './components/Editor';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Terminal from 'react-console-emulator';

import "./App.css";
import { PullProvider } from './context/PullContext';

let NavbarKey = 0;

class App extends Component {
	terminal: any

	constructor ({ props }: any) {
		super(props)
		this.terminal = React.createRef()
	}

	commands = {
		wait: {
			description: 'Waits one second and sends a message.',
			fn: () => {
				const terminal = this.terminal.current
				setTimeout(() => terminal.pushToStdout('Hello after 1 second!'), 1500)
				return 'Running, please wait...'
			}
		}
		
	}

	render() {
		return (
			<PullProvider>
				<div className="flex flex-col">
					<Navbar terminal={this.terminal.current} />

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
