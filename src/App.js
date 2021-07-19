import { Component } from "react";
import contractAddresses from "./contractAddresses.json";
import SeedFactory from "./contracts/SeedFactory.json";
import getWeb3 from './getWeb3';
import "./App.css";
import SeedCard from "./SeedCard";

const gasPriceUrl = `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.REACT_APP_GAS_STATION_KEY}`;

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
					factory: this.seedFactory.options.address,
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

	loadNewFactory = async (address) => {
		console.log(address);
		this.seedFactory = new this.web3.eth.Contract(SeedFactory.abi, address);
		this.setState(
			{
				factory: this.seedFactory.options.address
			}
		);
	}

	handleFactoryAddress = async (event) => {
		this.setState(
			{
				newFactoryAddress: event.target.value
			}
		);
	}

	renderDeployedSeeds = (seeds) => {
		return seeds.map(
			seed => <SeedCard key={seed} address={seed} web3={this.web3} account={this.state.currentAccount} gasPriceUrl={gasPriceUrl} />
		)
	}

    render() {
        return (
            this.state.isLoaded?
			<div className="App">
				<h5>
					Network used:- {this.state.network}<br/>
					Seed Factory Used:- {this.state.factory}<br/>
					Note:- Use the Refresh button for fetching the update seed state for paused and closed.
				</h5>
				<div>
					<input placeholder={"change factory address"} value={this.state.newFactoryAddress} onChange={this.handleFactoryAddress} />
					<button type={"button"} onClick={()=>this.loadNewFactory(this.state.newFactoryAddress)}>Load New Factory</button>
					{
						this.state.factory !== contractAddresses[this.state.network].SeedFactory?
							<button type={"button"} onClick={()=>this.loadNewFactory(contractAddresses[this.state.network].SeedFactory)}>Use Default Factory</button>
							:
							null
					}
				</div>
				<div>
					<button type={"button"} onClick={this.loadDeployedSeeds}>Load Seeds</button>
					{this.renderDeployedSeeds(this.state.seeds)}
				</div>
			</div>
			:
			<div>Loading</div>
        );
    }
}

export default App;
