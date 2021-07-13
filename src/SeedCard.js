import Seed from './contracts/Seed.json';
import ERC20 from './contracts/ERC20.json';
import { useEffect, useState } from 'react';
import axios from 'axios';

const SeedCard = ({address, web3, account}) => {

    const [isLoaded, setIsLoaded] = useState(false);
    const [seed, setSeed] = useState();
    const [token, setToken] = useState();
    const [tokenName, setTokenName] = useState();
    const [requiredTokens, setRequiredTokens] = useState('0');
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [isFunded, setIsFunded] = useState(false);
    const [balance, setBalance] = useState();
    const [metadata, setMetadata] = useState();
    const [whitelists, setWhitelists] = useState();

    useEffect(() => {
        const seed = new web3.eth.Contract(Seed.abi, address);
        setSeed(seed);
        const getToken = async () => {
            const seedToken = await seed.methods.seedToken().call();
            const token = new web3.eth.Contract(ERC20.abi, seedToken);
            setToken(token);
            setIsLoaded(true);
        };
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

    const fundSeed = async () => {
        await token.methods.transfer(seed.options.address, requiredTokens).send({
            from : account
        });
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

    const addWhitelist = async () => {
        const whitelists = await parseWhiteList();
        alert(`This address will be added as whitelist:- ${whitelists}`);
        await seed.methods.whitelistBatch(whitelists).send({
            from: account
        });
    }

    useEffect(
        () => {
            if(isLoaded){
                getTokenName();
                calculateRequiredSeed();
                checkIfWhiteList();
                checkIfFunded();
                checkBalance();
                getMetadata();
            }
        },[seed, isLoaded, web3, address, token]
    )

    return (
        isLoaded?(
            <div className={"seed-card"}>
                <h4>Seed:- {seed.options.address}</h4>
                <p>
                    Seed Token Address:- {token.options.address}<br/>
                    Seed Token Name:- {tokenName}<br />
                    Required Seed Tokens:- {requiredTokens}<br/>
                    Balance:- {balance}<br/>
                    isFunded:- {isFunded.toString()}<br/>
                    isWhitelisted:- {isWhitelisted.toString()}<br/>
                </p>
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
            </div>
            )
            :
            <div>Loading...</div>
    )
}

export default SeedCard;