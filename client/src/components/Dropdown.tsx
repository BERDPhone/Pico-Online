import React from 'react'

import { PullDispatchContextConsumer } from "../context/PullContext";

type props = {
	terminal: any,
	branches: string[],
	branch: string
}

export default function Dropdown({ branches, terminal, branch}: props) {

	const branchChanged = (event: any, callback: Function) => {
		console.log(`changing branch to ${event.target.value}`)
		terminal.clearInput();
		terminal.terminalInput.current.value = `branch ${event.target.value}`;
		terminal.processCommand();
	}

	return (
		<PullDispatchContextConsumer>
			{(setLoading) => {
				return (
					<div className="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-white hover:opacity-75 justify-center">
						<select 
							className="form-select appearance-none
								block
								w-full
								px-3
								py-1.5
								text-base
								font-normal
								text-white-800
								bg-pink-400 bg-clip-padding bg-no-repeat
								border border-solid border-gray-300
								rounded
								transition
								ease-in-out
								m-0
								focus:text-white-800 focus:bg-pink-300 focus:border-blue-600 focus:outline-none" 
							aria-label="Default select example"
							onChange={(event) => {branchChanged(event, setLoading)}}
							value={branch}
						>
							{ branches.map(listbranches => {
								return (<option key={listbranches}>{listbranches}</option>)
							}) }
							{/* <option value="1">Process-Status-Management</option>
							<option value="2">Two</option>
							<option value="3">Three</option> */}
						</select>
					</div>
				);
			}}
		</PullDispatchContextConsumer>
	)
}
