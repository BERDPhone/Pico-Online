import React, {Component} from 'react'
import { Socket } from 'socket.io-client';

import { PullDispatchContextConsumer } from "../context/PullContext";

type props = {
	terminal: any,
	socket: Socket
}

type state = {
	branch: string,
	branches: string[]
}

class Dropdown extends Component<props, state> {

	state = {
		branch: "main",
		branches: ["main"]
	}

	componentDidMount() {
		this.props.socket.on('displayBranch', (out: string) => {
			console.log(`changing branch in dropdown to ${out}`)
			this.setState({
				"branch": out
			});
		})

		this.props.socket.on('allBranches', (out: string[]) => {
			this.setState({
				"branches": out
			})
		})

		this.props.socket.emit('listBranches');
	}

	componentWillUnmount() {
		this.props.socket.off('displayBranch');
		this.props.socket.off('allBranches');
	}


	render() {
		const branchChanged = (event: any, callback: Function) => {
			console.log(`changing branch to ${event.target.value}`)
			this.props.terminal.clearInput();
			this.props.terminal.terminalInput.current.value = `branch ${event.target.value}`;
			this.props.terminal.processCommand();
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
								value={this.state.branch}
							>
								{ this.state.branches.map(listbranches => {
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
}


export default Dropdown;