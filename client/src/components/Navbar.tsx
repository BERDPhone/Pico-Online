import Dropdown from "./Dropdown";
import React, { Component } from "react";
import { FaBars } from "react-icons/fa";
import LoadButton from "./LoadButton";
import { PullContext, PullContextConsumer, PullDispatchContextConsumer } from "../context/PullContext";

type state = {
	navbarOpen: boolean,
	branchLoading: boolean,
	branches: string[],
	codeBuilding: boolean,
};

type props = {};

class Navbar extends Component<props, state> {
	state = {
		navbarOpen: false,
		branchLoading: true,
		branches: ["main"],
		codeBuilding: false,
	}

	static contextType = PullContext;	
	// static setPulling = React.useContext(PullDispatchContext);

	componentDidMount() {
		fetch(`${process.env.REACT_APP_SITE_URL}/branch`, {
			method: 'GET'
		})
			.then((response) => response.json())
			.then((data) => {
				this.setState({ branches: data });
			});
	}

	render() {

		const buildCode = () => {
			this.setState({ codeBuilding: true });
			fetch(`${process.env.REACT_APP_SITE_URL}/build`, {
				method: 'POST'
			})
				.then((response) => response.json())
				.then((data) => {
					console.log(data);
					this.setState({ codeBuilding: false });
				})
				.catch(() => {
					this.setState({ codeBuilding: false });	
				});
		}

		const pull = (callback: Function) => {
			callback(true);

			fetch(`${process.env.REACT_APP_SITE_URL}/pull`, {
				method: 'PATCH'
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.status === 200) {
						callback(false);
					}
				});
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
									<Dropdown branches={ this.state.branches } key="1" />
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
											Start
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