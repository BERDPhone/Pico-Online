import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import { sublime } from '@uiw/codemirror-theme-sublime';
import { Resizable } from 're-resizable';
import { ReactTerminal } from "react-terminal";

import Navbar from './components/Navbar'
import FileExplorer from './components/FileExplorer'

const files = {
	"name": "BDOS",
	"type": "folder",
	"items": [
		{
			"name": ".gitignore",
			"type": "file"
		},
		{
			"name": "index.html",
			"type": "file"
		},
		{
			"name": "package-lock.json",
			"type": "file"
		},
		{
			"name": "package.json",
			"type": "file"
		},
		{
			"name": "vite.config.js",
			"type": "file"
		},
		{
			"name": "src",
			"type": "folder",
			"items": [
				{
					"name": "App.css",
					"type": "file"
				},
				{
					"name": "App.jsx",
					"type": "file"
				},
				{
					"name": "index.css",
					"type": "file"
				},
				{
					"name": "main.jsx",
					"type": "file"
				},
				{
					"name": "components",
					"type": "folder",
					"items": [
						{
							"name": "Checkbox.jsx",
							"type": "file"
						}
					]
				},
				{
					"name": "pages",
					"type": "folder",
					"items": [
						{
							"name": "Home.jsx",
							"type": "file"
						},
						{
							"name": "About.jsx",
							"type": "file"
						}
					]
				}
			]
		}
	]

}



function App() {
	const commands = {
		whoami: "BjornTheProgrammer",
		help: "Sucks to be you",
		cd: (directory: string) => {
				return `changed path to ${directory}`
			},
		fetch: async () => {
				console.log("Being fetched")
				let final = "";

				let headers = new Headers();

				await fetch('http://localhost:9000/api/message')
					.then((response) => response.json())
					.then((data) => {
						console.log(data)
						final = data.message;
					});

				return final;
			}
	};

	return (
		<div className="flex flex-col">
			<Navbar />

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
				>
					<FileExplorer files={files}/>
				</Resizable>

				<CodeMirror
					className="flex-1 overflow-scroll"
					value="console.log('hello world!');"
					theme={sublime}
					height="100%"
					extensions={[langs.c()]}
				/>
			</div>


			<Resizable
				className="bg-current "
				// style={style}
				defaultSize={{
					width: '100%',
					height: '200px',
				}}
				maxWidth="100%"
				minWidth="1"
			>
					<ReactTerminal
						className="flex-none"
						commands={commands}
						showControlBar={false}
						theme="material-ocean"
					/>
			</Resizable>
		</div>
	);
}

export default App;
