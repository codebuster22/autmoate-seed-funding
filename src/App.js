import { Component } from "react";
import contractAddresses from "./contractAddresses.json";
import SeedFactory from "./contracts/SeedFactory.json";
import getWeb3 from './getWeb3';
import "./App.css";
import SeedCard from "./SeedCard";

class App extends Component {
    state = {
		isLoaded: false,
        currentAccount: "",
		seeds: []
    };

	getNetworkId = async () => {
		const networkId = await this.web3.eth.net.getId();
		return networkId === 5777 ? 1337 : networkId;
	}

	getNetwork = async () => {
		switch(await this.getNetworkId()){
			case 1: return 'mainnet';
			case 4: return 'rinkeby';
			default: return -1;
		}
	}

    componentDidMount = async () => {
        try {
			this.web3 = await getWeb3();

			window.ethereum.on("accountsChanged", (accounts) => {
				alert("Account changed. Current Account:- "+accounts[0]);
                this.setState({
                    currentAccount: accounts[0],
                });
            });

			window.ethereum.on("chainChanged", () => window.location.reload());
			const network = await this.getNetwork();
			if(network === -1){
				throw Error("network not supported");
			}
			this.seedFactory = new this.web3.eth.Contract(SeedFactory.abi, contractAddresses[network].SeedFactory);

			this.setState(
				{
					network: network,
					isLoaded: true,
					currentAccount: (await this.web3.eth.getAccounts())[0]
				}
			)


        } catch (error) {
            console.log(error);
        }
    };

	// Get all the past 'SeedCreated' events, filter the seed address and return array of seedAddress
	getDeployedSeedAddress = async () => {
		const allEvents = await this.seedFactory.getPastEvents('SeedCreated',{
			fromBlock: 0,
			toBlock: 'latest'
		});
		return allEvents.map(
			event => event.returnValues.newSeed
		);
	}

	// update set with array of seed address. This will update the render
	loadDeployedSeeds = async () => {
		const seeds = await this.getDeployedSeedAddress();
		this.setState({
			seeds: seeds
		});
	}

	renderDeployedSeeds = (seeds) => {
		return seeds.map(
			seed => <SeedCard key={seed} address={seed} web3={this.web3} account={this.state.currentAccount} />
		)
	}

    render() {
        return (
            <div className="App">
				<h4>
					Network used:- {this.state.network}
				</h4>
				<div>
					<input placeholder={"change factory address"} name={"factoryAddress"} value={this.state.factoryAddress} />
					<button type={"button"} onClick={this.loadNewFactory}>Load New Factory</button>
				</div>
				<div>
					<button type={"button"} onClick={this.loadDeployedSeeds}>Load Seeds</button>
					{this.renderDeployedSeeds(this.state.seeds)}
				</div>
            </div>
        );
    }
}

export default App;
