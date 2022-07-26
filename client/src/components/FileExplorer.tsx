import { useState } from "react";
import { FaFolder } from "react-icons/fa";

const FileExplorer = ({ files }: any) => {
	const [isExpanded, toggleExpanded] = useState(false);

	if (files.type === 'folder') {
		return (
			<div>
				{/*<FaFolder />*/}
				<h2 className="folder-title text-white pl-2 pr-3 whitespace-nowrap" onClick={() => toggleExpanded(!isExpanded)}>{files.name}</h2><br />
				{
					isExpanded && files.items.map((item: any) => <FileExplorer files={item} />)
				}
			</div>
		)
	}
	return (
		<>
			<h3 className="text-slate-300 pl-5 pr-3 whitespace-nowrap">{files.name}</h3><br />
		</>
	)
}

export default FileExplorer;