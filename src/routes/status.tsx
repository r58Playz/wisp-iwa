import { reconnect } from "../wasm";

const Status: Component<{}, {}> = function() {
	return (
		<div>
			<button on:click={async ()=>{
				reconnect();
			}}>connect</button>
		</div>
	);
};

export default Status;
