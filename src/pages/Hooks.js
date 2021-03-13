import {useState, useEffect, useContext, useCallback, useMemo} from 'react';
import StakingRewardsV2 from '../web3/abi/StakingRewardsV2.json'
import {
    getContract,
    useActiveWeb3React,
    useBlockNumber, useMultipleContractSingleData,
    useSingleCallResult,
    useSingleContractMultipleData
} from "../web3";
import { Interface } from '@ethersproject/abi'

import {ChainId, getGLFStakingAddress, TOKEN_FACTORY} from "../web3/address";
import {mainContext} from "../reducer";
import {ANTIMATTER_TRANSACTION_LIST, HANDLE_POPUP_LIST} from "../const";
import {BigNumber} from "bignumber.js";
import {getNetworkLibrary} from "../hooks/multicall/hooks";
import TokenFactory from '../web3/abi/TokenFactory.json'
import ERC20 from '../web3/abi/ERC20.json'
const ERC20_INTERFACE = new Interface(ERC20)


export const useGLFBalance = () => {
    const {account, active, library, chainId} = useActiveWeb3React()
    const [glfBalance, setGLFBalance] = useState()

    useEffect(() => {
        if (active) {
            try {
                const contract = getContract(library, StakingRewardsV2.abi, getGLFStakingAddress(chainId))
                contract.balanceOf(account).then(res => {
                    setGLFBalance(res)
                })
            } catch (e) {
                console.log('load totalSupply error:', e)
            }

        }
    }, [active])

    return {glfBalance}
}

export const useBalance = (address, options) => {
    const curChainId = options?.curChainId

    const {account, active, library, chainId} = useActiveWeb3React()
    const {blockNumber} = useBlockNumber()
    const [balance, setBalance] = useState()

    useEffect(() => {

        if (((active && chainId && address) && (curChainId && curChainId === chainId)) || (active && chainId && address && !curChainId)) {
            try {
                const contract = getContract(library, ERC20, address)
                contract.balanceOf(account).then(res => {
                    console.log('token balance--->',res.toString())
                    setBalance(res.toString())
                })
            } catch (e) {
                console.log('load token balance error1:', address)
            }
        }
    }, [active, chainId, address ,blockNumber, account, curChainId, library])

    return balance
}

export const useAllowance = (tokenAddress, address, options) => {
    const curChainId = options?.curChainId
    const approveStatus = options?.approveStatus
    const {account, active, library, chainId} = useActiveWeb3React()
    const {blockNumber} = useBlockNumber()
    const [balance, setBalance] = useState()

    useEffect(() => {

        if ((active && chainId && address && tokenAddress) && (curChainId && curChainId === chainId) && approveStatus) {

            try {
                console.log('allowance--->', tokenAddress, address)
                const contract = getContract(library, ERC20, tokenAddress)
                contract.allowance(account, address).then(res => {
                    console.log('token allowance--->',res.toString())
                    setBalance(res.toString())
                })
            } catch (e) {
                console.log('load token balance error1:', tokenAddress, address)
            }
        }else {
            setBalance(undefined)
        }
    }, [active, chainId, address ,blockNumber, account, tokenAddress, curChainId, library, approveStatus])

    return balance
}


export const useTransactionAdder = () => {
    const {chainId} = useActiveWeb3React()
    const {dispatch} = useContext(mainContext);
    return useCallback((response, customData) => {
        if (!response) return
        const {hash} = response
        const {summary, stake, claim, approve, hashLink} = customData
        const now = () => new Date().getTime()
        dispatch({
            type: ANTIMATTER_TRANSACTION_LIST,
            transaction: {hash, chainId, summary, stake, claim, approve ,hashLink ,addedTime: now()}
        })
    }, [])
}

export const TransactionsUpdater = () => {
    const {dispatch} = useContext(mainContext);
    const {chainId, library} = useActiveWeb3React()
    const {blockNumber} = useBlockNumber()
    const {transactions} = useContext(mainContext).state;
    useEffect(() => {
        if (!chainId || !library || !blockNumber) return
        transactions
            .filter(item => {
                return !item.receipt && new Date().getTime() - item.addedTime < 86_400_000
            })
            .forEach(tx => {
                console.log('tx---->', tx)
                console.log('hash---->', tx.hash)

                getNetworkLibrary(chainId)
                    .getTransactionReceipt(tx.hash)
                    .then(receipt => {
                        console.log('receipt---->', receipt)

                        if (receipt) {
                            dispatch({
                                type: ANTIMATTER_TRANSACTION_LIST, transaction: {
                                    ...tx,
                                    stake: tx.stake? {...tx.stake, status: receipt.status === 1 ? 1 : -1} :null,
                                    claim: tx.claim? {...tx.claim, status: receipt.status === 1 ? 1 : -1} :null,
                                    approve: tx.approve? {...tx.approve, status: receipt.status === 1 ? 1 : -1} :null,
                                    nonce: tx.stake? new BigNumber(receipt.logs[receipt.logs.length-1].data.substring(0, 66)).toString() : null,
                                    receipt: {
                                        blockHash: receipt.blockHash,
                                        blockNumber: receipt.blockNumber,
                                        contractAddress: receipt.contractAddress,
                                        from: receipt.from,
                                        status: receipt.status,
                                        to: receipt.to,
                                        transactionHash: tx.hash,
                                        transactionIndex: receipt.transactionIndex
                                    }
                                }
                            })
                            dispatch({
                                type: HANDLE_POPUP_LIST,
                                auction: 'add',
                                popup: {
                                    key: receipt.transactionHash,
                                    popKey: receipt.transactionHash,
                                    hash: receipt.transactionHash,
                                    hashLink: tx.hashLink,
                                    summary: tx.summary,
                                    success: receipt.status === 1
                                }
                            })
                        } else {

                        }
                    })
            })
    }, [chainId, blockNumber, transactions])
    return null
}

export const useHasDeposite = () => {
    const {chainId, account} = useActiveWeb3React()
    const {transactions} = useContext(mainContext).state;

    return useMemo(() => {

        if (chainId && account && transactions.length !== 0) {
            console.log('curDeposite', transactions)
            return false
        } else {
            return false
        }
    }, [transactions, chainId, account])
}

export const useRemovePopup = () => {
    const {dispatch} = useContext(mainContext);

    return useCallback((key) => {
            dispatch({type: HANDLE_POPUP_LIST, auction: 'remove', popup: {key: key, popKey: key, hash: key}})
        },
        [dispatch]
    )
}


export const useTokenList = () =>{
    const {account, chainId, active} = useActiveWeb3React()
    const options = {chainId: ChainId.ROPSTEN, library: getNetworkLibrary(3)}
    const tokenFactoryContract = getContract(getNetworkLibrary(3), TokenFactory, TOKEN_FACTORY[ChainId.ROPSTEN])

    const tokens =  useSingleCallResult(tokenFactoryContract, 'allCertifiedTokens', undefined, options)

    const [tokensData, setTokensData] = useState()

    useEffect(()=>{
        if(!tokens) return
        setTokensData(tokens)
    },[tokens])

    const names = useMultipleContractSingleData(tokensData? tokensData.tokens: [],ERC20_INTERFACE, 'name', undefined, options)

    const mappingTokens = useSingleContractMultipleData(tokenFactoryContract, 'chainIdMappingTokenMappeds',tokensData && tokensData.tokens? tokensData.tokens.map(item => {return [item]}):[] , options)

    const curAddresses = active && tokensData && mappingTokens ? mappingTokens.map((item, index)=>{
        const mainChainID = tokensData.chainIds[index]
        const position = item.chainIds.findIndex(chainIdItem =>{return chainIdItem.toString() === chainId.toString()})
        console.log('curAddresses item', tokensData.tokens[index], chainId , mainChainID)
        return chainId.toString() === mainChainID.toString() ? tokensData.tokens[index] : item.mappingTokenMappeds_[parseInt(position.toString())]
    }) :[]
    console.log('curAddresses--->',curAddresses)

    const balances = useMultipleContractSingleData(curAddresses, ERC20_INTERFACE, 'balanceOf', [account])

    console.log('balance--->',balances)

    const decimals = useMultipleContractSingleData(tokensData? tokensData.tokens: [],ERC20_INTERFACE, 'decimals', undefined, options)

    return useMemo(()=>{
        return tokens ? tokens.symbols.map((item, index) =>{
            return {
                symbol: item,
                address: tokens.tokens[index],
                chainId: parseInt(tokens.chainIds[index].toString()),
                name: names?.[index],
                decimals: decimals?.[index],
                balance: balances?.[index]?.['balance'].toString(),
                chains: mappingTokens?.[index]?.['chainIds'].map((item, subIndex) => {
                    return {chainId: parseInt(item), address: mappingTokens?.[index]?.['mappingTokenMappeds_'][subIndex]}
                })
            }
        }) : []
    },[tokens, names, balances, mappingTokens])
}


export const useReceiveList = (token) =>{
    const tokens = token? token.chains  : []
    console.log('receive tokens', tokens)


}
