import { hi, initWasm } from "../wasm";

const Status: Component<{}, {}> = function() {
	return (
		<div>
			<button on:click={async ()=>{
				await initWasm();
				console.log(hi());
			}}>test</button>
		</div>
	);
};

export default Status;
