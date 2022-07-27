import { useState } from "react";
import { FaFolder, FaFileCode } from "react-icons/fa";

let key = 0;

const FileExplorer = ({ files, margin}: any) => {
	const [isExpanded, toggleExpanded] = useState(false);

	if (files.type === 'folder') {
		return (
			<div className={margin}>
				{/*<FaFolder />*/}
				<span className="folder-title text-white pl-2 pr-3 mt-5 whitespace-nowrap" onClick={() => toggleExpanded(!isExpanded)}><FaFolder className="inline" /> {files.name}</span><br />
				{
					isExpanded && files.children.map((item: any) => {
						console.log("item: ", item);
						return (
							<FileExplorer margin="ml-5" files={item} key={key += 1} />
						);
					})
				}
			</div>
		)
	}
	return (
		<>
			<span className={`text-slate-300 pl-5 pr-3 whitespace-nowrap ${margin}`}><FaFileCode className="inline" /> {files.name}</span><br />
		</>
	)
}

export default FileExplorer;