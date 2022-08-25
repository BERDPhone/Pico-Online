import { Component } from 'react'
import { Switch } from '@headlessui/react'
import { Socket } from 'socket.io-client'

type props = {
	socket: Socket,
	terminal: any
}

type state = {
	enabled: boolean
}

class Toggle extends Component<props, state> {

	componentDidMount() {
		this.props.socket.on('uart', (out) => {
			if (this.state.enabled) {
				this.props.terminal.current.pushToStdout(`uart: ${out}`)
				this.props.terminal.current.scrollToBottom();
			}
		});
	}

	componentWillUnmount() {
		this.props.socket.off('uart');
	}

	state = {
		enabled: false
	}

	render() {
		// const [enabled, setEnabled] = useState(false)

		return (
			<Switch.Group>
				<div className="flex absolute right-2 top-2">
					<Switch.Label className="mr-4 text-white items-end">UART Output</Switch.Label>
					<Switch
						checked={this.state.enabled}
						onChange={(checked) => {
								this.setState(prevState => {
									return ({ 
										enabled: !prevState.enabled
									});
								})
							}
						}
						className={`${
							this.state.enabled ? 'bg-blue-600' : 'bg-gray-400'
						} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
					>
						<span
							className={`${
								this.state.enabled ? 'translate-x-6' : 'translate-x-1'
							} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
						/>
					</Switch>
				</div>
			</Switch.Group>
		)
	}
}

export default Toggle;