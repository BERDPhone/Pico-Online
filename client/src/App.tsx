import React, {Component} from 'react';
import { Resizable } from 're-resizable';
import { ReactTerminal } from "react-terminal";

import Navbar from './components/Navbar'
import Editor from './components/Editor'

import "./App.css";
import { PullProvider } from './context/PullContext';

let NavbarKey = 0;

class App extends Component {
	render() {

		const commands = {
			whoami: "BjornTheProgrammer",
			clear: "Nope, Sucks to be you",
			help: "Sucks to be you",
			cd: (directory: string) => {
				return `changed path to ${directory}`
			},
			fetch: async () => {
				let final = "";

				await fetch(`${process.env.REACT_APP_SITE_URL}/message`)
					.then((response) => response.json())
					.then((data) => {
						final = data.message;
					});

				return final;
			},
			branch: async (name: string) => {
				return `changing branch to ${name}`;
			}
		};

		return (
			<PullProvider>
				<div className="flex flex-col">
					<Navbar />

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
							<ReactTerminal
								className="flex-none"
								commands={commands}
								showControlBar={false}
								theme="material-ocean"
							/>
					</Resizable>
				</div>
			</PullProvider>
		);
	}
}

export default App;
