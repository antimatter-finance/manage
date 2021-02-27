import React, {useEffect, useState} from 'react'
import {ReactComponent as ETH} from '../../assets/icon/eth.svg'
import {ReactComponent as Binance} from '../../assets/icon/binance.svg'
import {ReactComponent as Huobi} from '../../assets/icon/huobi.svg'
import ETH_logo from '../../assets/icon/eth.svg'
import Binnace_logo from '../../assets/icon/binance.svg'
import Huobi_logo from '../../assets/icon/huobi.svg'
export const CHAIN = [
    {id: 1, title: 'ETH', chainId: 1 ,logo: <ETH className="icon"/>, icon: ETH_logo},
    {id: 2, title: 'BSC',chainId: 56, logo: <Binance className="icon"/>, icon: Binnace_logo},
    {id: 3, title: 'HECO',chainId: 128, logo: <Huobi className="icon"/>, icon: Huobi_logo},
    {id: 4, title: 'Ropsten',chainId: 3, logo: <Binance className="icon"/>, icon: ETH_logo},
    {id: 5, title: 'Rinkeby',chainId: 4, logo: <Binance className="icon"/>, icon: ETH_logo},
]

export const DropDown = ({index = 1, disabledId, onSelect, disabled}) => {
    console.log('index--->', index)
    const [selectedChain, setSelectedChain] = useState(index)

    useEffect(()=>{
        setSelectedChain(index)
    },[index])

    return (
        <nav role={`navigation`} className={`active-${selectedChain} ${disabled ? 'nav_disabled': ''}`}>
            <ul>
                {CHAIN.map((item, index) => {
                    return (
                        <li onClick={() => {
                            if(index+1 !== disabledId){
                                setSelectedChain(index)
                                onSelect(item)
                            }
                        }}>
                            <a className={disabledId === index+1? 'disabled':''} tabIndex={item.id}>{item.logo}{item.title}</a>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}