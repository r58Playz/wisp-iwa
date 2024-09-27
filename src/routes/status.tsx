import { hi } from "../wasm";

const Status: Component<{}, {}> = function() {
	return (
		<div>
			<button on:click={async ()=>{
				console.log(hi());
			}}>test</button>
		</div>
	);
};

export default Status;
