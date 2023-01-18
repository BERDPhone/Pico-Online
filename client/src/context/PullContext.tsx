import { createContext, useState } from 'react';

const PullContext = createContext<boolean>(false);
const PullDispatchContext = createContext<Function>(() => { return false; });

const PullProvider = ({ children }: any) => {
	const [loading, setLoading] = useState(false);

	return (
		<PullContext.Provider value={ loading }>
			<PullDispatchContext.Provider value={ setLoading } >
				{children}
			</PullDispatchContext.Provider>
		</PullContext.Provider>
	);
};

const PullContextConsumer = PullContext.Consumer;
const PullDispatchContextConsumer = PullDispatchContext.Consumer;

export {PullProvider, PullContext, PullDispatchContext, PullContextConsumer, PullDispatchContextConsumer}