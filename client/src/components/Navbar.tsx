import Dropdown from "./Dropdown";
import React, { Component } from "react";
import { FaBars } from "react-icons/fa";
import LoadButton from "./LoadButton";
import { PullContext, PullContextConsumer, PullDispatchContextConsumer } from "../context/PullContext";
import { Socket } from "socket.io-client";

type state = {
	navbarOpen: boolean,
	codeBuilding: boolean,
};

type props = {
	socket: Socket,
	terminal: any,
};

class Navbar extends Component<props, state> {
	state = {
		navbarOpen: false,
		codeBuilding: false,
	}

	static contextType = PullContext;

	render() {

		const buildCode = () => {
			this.props.terminal.current.clearInput();
			this.props.terminal.current.terminalInput.current.value = "build";
			this.props.terminal.current.processCommand();
		}

		const pull = (callback: Function) => {
			this.props.terminal.current.clearInput();
			this.props.terminal.current.terminalInput.current.value = "pull";
			this.props.terminal.current.processCommand();
		}

		return (
			<>
				<nav className="relative flex flex-wrap items-center justify-between px-2 py-3 bg-slate-900">
					<div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
						<div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
							<a
								className="text-sm font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase text-white"
								href="#pablo"
							>
								BDOS Chip Online 
							</a>
							<button
								className="text-white cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
								type="button"
								onClick={() => {
									this.setState(prevState => { 
										return {
											navbarOpen: !prevState.navbarOpen
										};
									})
								}}
							>
								<FaBars />
							</button>
						</div>
						<div
							className={
								"lg:flex flex-grow items-center" +
								(this.state.navbarOpen ? " flex" : " hidden")
							}
							id="example-navbar-danger"
						>
							<ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
								<li className="nav-item">
									<Dropdown terminal={this.props.terminal.current} socket={ this.props.socket } key="1" />
								</li>
								<li className="nav-item">
									<div className="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-white hover:opacity-75">
										<PullContextConsumer>
											{(loading) => {
												return (
													<PullDispatchContextConsumer>
														{(setLoading) => {
															return (
																<LoadButton 
																	className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded uppercase"
																	onClick={() => pull(setLoading)}
																	loading={ loading }
																>
																	Pull
																</LoadButton>
															);
													}}
													</PullDispatchContextConsumer>
												);
											}}
										</PullContextConsumer>
									</div>
								</li>
								<li className="nav-item">
									<div className="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-white hover:opacity-75">
										<LoadButton 
											className="ml-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded uppercase"
											onClick={() => buildCode()}
											loading={ this.state.codeBuilding }
										>
											Build
										</LoadButton>
									</div>
								</li>
							</ul>
						</div>
					</div>
				</nav>
			</>
		);
	}
}

export default Navbar