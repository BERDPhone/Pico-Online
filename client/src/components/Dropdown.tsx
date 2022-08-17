import React from 'react'

import { PullDispatchContextConsumer } from "../context/PullContext";

type props = {
	branches: string[]
}

export default function Dropdown({ branches }: props) {

	const branchChanged = (event: any, callback: Function) => {
		callback(true);
		fetch(`${process.env.REACT_APP_SITE_URL}/branch/${event.target.value}`, {
			method: 'PATCH'
		})
			.then((response) => response.json())
			.then((data) => {
				callback(false);
				if (data.status === 200) {
					console.log("Successfully changed branch")
				} else {
					console.log(`Failed to change to branch ${event.target.value}`)
				}
			});
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
						>
							{ branches.map(branch => {
								return (<option key={branch}>{branch}</option>)
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
