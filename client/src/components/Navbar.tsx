import React from "react";
import { FaBars } from "react-icons/fa";

function Navbar({ fixed }: any) {
	const [navbarOpen, setNavbarOpen] = React.useState(false);
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
							onClick={() => setNavbarOpen(!navbarOpen)}
						>
							<FaBars />
						</button>
					</div>
					<div
						className={
							"lg:flex flex-grow items-center" +
							(navbarOpen ? " flex" : " hidden")
						}
						id="example-navbar-danger"
					>
						<ul className="flex flex-col lg:flex-row list-none lg:ml-auto">
							<li className="nav-item">
								<div className="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-white hover:opacity-75">
									<button className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded uppercase">
										Pull
									</button>
								</div>
							</li>
							<li className="nav-item">
								<div className="px-3 py-2 flex items-center text-xs uppercase font-bold leading-snug text-white hover:opacity-75">
									<button className="ml-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded uppercase">
										Start
									</button>
								</div>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</>
	);
}

export default Navbar