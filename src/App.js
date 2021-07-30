import { Component, useState } from "react";
import contractAddresses from "./contractAddresses.json";
import SeedFactory from "./contracts/SeedFactory.json";
import getWeb3 from './getWeb3';
import "./App.css";
import SeedCard from "./SeedCard";
import { Card, Container, Navbar, Button, Modal, Form } from "react-bootstrap";
import PrimeLAUNCH from './assets/img/PrimeLAUNCH.svg';

const gasPriceUrl = `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.REACT_APP_GAS_STATION_KEY}`;

class App extends Component {
    state = {
		isLoaded: false,
        currentAccount: "",
		seeds: [],
		show: false
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

	handleClose = () => {
		this.setState({show: false});
	}

	handleShow = () => {
		this.setState({show: true});
	}

	handleUpdate = (address) => {
		this.seedFactory = new this.web3.eth.Contract(SeedFactory.abi, address);
		this.setState({
			factory: address,
			show: false
		});
	}

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
			seed => <SeedCard key={seed} network={this.state.network} address={seed} web3={this.web3} account={this.state.currentAccount} gasPriceUrl={gasPriceUrl} />
		)
	}

    render() {
        return (
            this.state.isLoaded?
			<div className="App">
				<Navbar bg={"prime-header"} variant={"dark"}>
				  <Container>
				    <Navbar.Brand href="#home">
						<img
							src={PrimeLAUNCH}
							alt={"PrimeLaunch Logo"}
						/>
					</Navbar.Brand>
				    <Navbar.Toggle />
				    <Navbar.Collapse className="justify-content-end">
							<span class={"mr-2"}>{this.state.network}</span>
							<Card bg={"prime-header-factory-card"} body>
								<span>
									Seed Factory Used:- {this.state.factory}
									<Button type={"button"} onClick={this.handleShow} variant="link">Edit</Button>
								</span>
							</Card>
				    </Navbar.Collapse>
				  </Container>
				  <UpdateSeedFactory show={this.state.show} handleUpdate={this.handleUpdate} handleClose={this.handleClose} seedFactory={this.state.factory} />
				</Navbar>
				<div className={"load-btn-container"}>
					<Button bsPrefix={"prime-btn btn"} type={"button"} onClick={this.loadDeployedSeeds} >Load Seeds</Button>
					{
						this.state.factory !== contractAddresses[this.state.network].SeedFactory?
							<Button bsPrefix={"prime-btn btn"} type={"button"}  onClick={()=>this.loadNewFactory(contractAddresses[this.state.network].SeedFactory)}>Use Default Factory</Button>
							:
							null
					}
				</div>
				<div className={"seed-card-wrapper"}>
					{this.renderDeployedSeeds(this.state.seeds)}
				</div>
			</div>
			:
			<div>Loading</div>
        );
    }
}

const UpdateSeedFactory = ({seedFactory, show, handleClose, handleUpdate}) => {
	const [newSeedFactory, setSeedFactory] = useState(seedFactory);
	return (
		<Modal contentClassName={"bg-prime-header"} show={show} onHide={handleClose}>
        <Modal.Header closeVariant={"white"} closeButton>
          <Modal.Title>Load new Seed Factory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
		<Form>
  			<Form.Group className="mb-3" controlId="formBasicEmail">
  			  <Form.Label>Seed Factory address</Form.Label>
  			  <Form.Control 
				onChange={(event)=>setSeedFactory(event.target.value)} 
				type="text" 
				placeholder="Enter new seed factory address" 
				/>
  			  <Form.Text className="text-muted">
  			    We'll load seed from this seed factory.
  			  </Form.Text>
  			</Form.Group>
		</Form>
		</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={()=>handleUpdate(newSeedFactory)}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
	)
}

export default App;
