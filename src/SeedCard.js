import Seed from './contracts/Seed.json';
import ERC20 from './contracts/ERC20.json';
import { useEffect, useState } from 'react';
import axios from 'axios';

const SeedCard = ({address, web3, account, gasPriceUrl}) => {

    const [isLoaded, setIsLoaded] = useState(false);
    const [seed, setSeed] = useState();
    const [token, setToken] = useState();
    const [tokenName, setTokenName] = useState();
    const [requiredTokens, setRequiredTokens] = useState('0');
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [isFunded, setIsFunded] = useState(false);
    const [balance, setBalance] = useState();
    const [metadata, setMetadata] = useState();
    const [admin, setAdmin] = useState();
    const [name, setName] = useState();
    const [isPaused, setIsPaused] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        const seed = new web3.eth.Contract(Seed.abi, address);
        const getToken = async () => {
            const seedToken = await seed.methods.seedToken().call();
            const token = new web3.eth.Contract(ERC20.abi, seedToken);
            setToken(token);
            setIsLoaded(true);
        };
        setSeed(seed);
        getToken();
    },[address, web3]);

    const getTokenName = async () => {
        const tokenName = await token.methods.name().call();
        setTokenName(tokenName);
    }

    const calculateRequiredSeed = async () => {
        const forDistribution = await seed.methods.seedAmountRequired().call();
        const forFee = await seed.methods.feeAmountRequired().call();
        setRequiredTokens(((new web3.utils.BN(forDistribution)).add(new web3.utils.BN(forFee))).toString());
    }
    const checkIfWhiteList = async () => {
        const isWhitelisted = await seed.methods.permissionedSeed().call();
        setIsWhitelisted(isWhitelisted);
    }
    const checkIfFunded = async () => {
        const isFunded = await seed.methods.isFunded().call();
        setIsFunded(isFunded);
    }
    const checkBalance = async () => {
        const balance = await token.methods.balanceOf(address).call();
        setBalance(balance);
    }

    const getMetadata = async () => {
        const hashedMetadata = await seed.methods.metadata().call();
        const metadata = web3.utils.toAscii(hashedMetadata);
        setMetadata(metadata);
    }

    const getAdmin = async () => {
        setAdmin(await seed.methods.admin().call());
    }

    const fundSeed = async () => {
        try{
            const gas = await token.methods.transfer().estimateGas({from: account});
            const gasPrice = await getGasPrice();
            const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
            alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
            await token.methods.transfer(seed.options.address, requiredTokens).send({
                from : account,
                gas,
                gasPrice
            });
        } catch (error) {
            alert(error.message);
        }
    }

    const fetchWhitelist = async (url) => {
        const res = await axios.get(url);
        const whitelists = (res.data).split(",");
        return whitelists.map((account) => {
            return account.replace(/\n/g, "");
        });
    };

    const parseWhiteList = async () => {
        const res = await axios.get(`https://ipfs.io/ipfs/${metadata}`);
        return await fetchWhitelist(JSON.parse(res.data).seedDetails.whitelist);
    }
    const parseName = async () => {
        const res = await axios.get(`https://ipfs.io/ipfs/${metadata}`);
        return JSON.parse(res.data).general.projectName;
    }

    const getGasPrice = async () => {
        const unparsedGasPrice = (await axios.get(gasPriceUrl)).data.average/10
        return web3.utils.toWei(
            unparsedGasPrice.toString(),
            'gwei'
            );
    }

    const addWhitelist = async () => {
        const whitelists = await parseWhiteList();
        alert(`This address will be added as whitelist:- ${whitelists}`);
        try{
            const gas = await seed.methods.whitelistBatch(whitelists).estimateGas({from: account});
            const gasPrice = await getGasPrice();
            const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
            alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
            await seed.methods.whitelistBatch(whitelists).send({
                from: account,
                gas,
                gasPrice 
            });
        } catch (error) {
            alert(error.message);
        }
    }

    const getSeedStatus = async () => {
        setIsPaused(await seed.methods.paused().call());
        setIsClosed(await seed.methods.closed().call());
    }

    const pause  = async () => {
        if(!isPaused){
            try{
                const gas = await seed.methods.pause().estimateGas({from: account});
                const gasPrice = await getGasPrice();
                const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
                alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
                await seed.methods.pause().send({
                    from: account,
                    gas,
                    gasPrice
                });
            } catch (error) {
                alert(error.message);
            }
            return;
        }
        alert("Seed is already Paused");
    }

    const unpause = async () => {
        if(isPaused){
            try{
                const gas = await seed.methods.unpause().estimateGas({from: account});
                const gasPrice = await getGasPrice();
                const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
                alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
                await seed.methods.unpause().send({
                    from: account,
                    gas,
                    gasPrice
                });
            }catch (error){
                alert(error.message);
            }
            return;
        }
        alert("Seed is already Unpaused");
    }

    const close = async () => {
        if(!isClosed){
            try{
                const gas = await seed.methods.close().estimateGas({from: account});
                const gasPrice = await getGasPrice();
                const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
                alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
                await seed.methods.close().send({
                    from: account,
                    gas,
                    gasPrice
                });
            } catch (error) {
                alert(error.message);
            }
            return;
        }
        alert("Seed is already Closed");
    }


    useEffect(
        () => {
            if(isLoaded){
                getTokenName();
                getAdmin();
                calculateRequiredSeed();
                checkIfWhiteList();
                checkIfFunded();
                checkBalance();
                getSeedStatus();
                getMetadata();
            }
        },[isLoaded]
    );

    useEffect(
        () => {
            if(metadata){
                (async () => {
                    setName(await parseName());
                })();
            }
        }, [metadata]
    );

    return (
        isLoaded?(
            <div className={"seed-card"}>
                <h4>Project Name:- {name}</h4>
                <p>
                    Seed:- {seed.options.address}<br />
                    Admin:- {admin}<br />
                    Seed Token Address:- {token.options.address}<br/>
                    Seed Token Name:- {tokenName}<br />
                    Required Seed Tokens:- {requiredTokens}<br/>
                    Balance:- {balance}<br/>
                    isFunded:- {isFunded.toString()}<br/>
                    isWhitelisted:- {isWhitelisted.toString()}<br/>
                    isClosed:- {isClosed.toString()}<br/>
                    isPaused:- {isPaused.toString()}<br/>
                </p>
                <button type={'button'} onClick={getSeedStatus}>Refresh Seed Status</button>
                {
                    isClosed?
                        null
                        :
                        (<>
                            <button type={'button'} onClick={close}>Close Seed</button>
                            {
                                isPaused?
                                    <button type={'button'} onClick={unpause}>Unpause Seed</button>
                                    :
                                    <button type={'button'} onClick={pause}>Pause Seed</button>
                            }
                            {
                                isWhitelisted?
                                    <button type={'button'} onClick={addWhitelist}>Add Whitelist</button>
                                    :
                                    null
                            }
                            {
                                (!isFunded && balance === '0')?
                                    <button type={'button'} onClick={fundSeed}>Fund Seed</button>
                                    :
                                    null
                            }
                        </>)
                    }
            </div>
            )
            :
            <div>Loading...</div>
    )
}

export default SeedCard;