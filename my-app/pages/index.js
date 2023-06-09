import { useEffect, useRef, useState } from 'react'
import Web3Modal from "web3modal"
import styles from '../styles/Home.module.css'
import { providers, Contract, utils } from 'ethers'
import Head from 'next/head'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../constants'

export default function Home() {
    const [walletConnected, setWalletConnected] = useState(false)
    const [presaleStarted, setPresaleStarted] = useState(false)
    const [presaleEnded, setPresaleEnded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [numTokenMinted, setNumTokenMinted] = useState("")
    const [isOwner, setIsOwner] = useState(false)

    const web3ModalRef = useRef()

    const getNumMintedTokens = async () => {
        setLoading(true)
        try {
            const provider = await getProviderORSigner()
            const contract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                provider
            )

            const numTokenIds = await contract.tokenIds()
            setNumTokenMinted(numTokenIds.toString())
        } catch (err) {
            console.error(err);
        }
        setLoading(false)
    }

    const mint = async (type) => {
        setLoading(true)
        try {
            const signer = await getProviderORSigner(true)
            const contract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                signer
            )
            if (type === 'public') {
                var txn = await contract.mint({
                    value: utils.parseEther("0.01")
                })
                console.log(txn,'---------');
            } else {
                var txn = await contract.presaleMint({
                    value: utils.parseEther("0.01")
                })
            }

            await txn.wait()
            alert('You successfully minted a CryptoDev!')
        } catch (err) {
            console.error(err);
        }
        setLoading(false)
    }

    const checkIfPresaleEnded = async () => {
        setLoading(true)
        try {
            const provider = await getProviderORSigner()
            const contract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                provider
            )

            const presaleEndTime = await contract.presaleEnded()
            const currentTimeInSeconds = Date.now() / 1000

            const hasPresaleEnded = presaleEndTime.lt(Math.floor(currentTimeInSeconds))

            setPresaleEnded(hasPresaleEnded)
        } catch (err) {
            console.error(err);
        }
        setLoading(false)
    }

    const getOwner = async () => {
        try {
            const signer = await getProviderORSigner(true)
            const contract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                signer
            )

            const owner = await contract.owner()

            const userAddress = await signer.getAddress()

            if (owner.toLowerCase() === userAddress.toLowerCase()) {
                setIsOwner(true)
            }
        } catch (err) {
            console.error(err);
        }
    }

    const startPresale = async () => {
        setLoading(true)
        try {
            const signer = await getProviderORSigner(true)
            const contract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                signer
            )

            const txn = await contract.startPresale()
            await txn.wait()
            setPresaleStarted(true)
        } catch (err) {
            console.error(err);
        }
        setLoading(false)
    }

    const checkIfPresaleStarted = async () => {
        setLoading(true)
        try {
            const provider = await getProviderORSigner()
            const contract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFT_CONTRACT_ABI,
                provider
            )

            const isPresaleStarted = await contract.presaleStarted()
            setPresaleStarted(isPresaleStarted)
            setLoading(false)
            return isPresaleStarted
        } catch (err) {
            setLoading(false)
            return false
        }
    }

    const onPageLoad = async () => {
        await connectWallet()
        await getOwner()
        const presaleStarted = await checkIfPresaleStarted()
        if (presaleStarted) {
            await checkIfPresaleEnded()
        }
        await getNumMintedTokens()

        setInterval(async () => {
            await getNumMintedTokens()
            const started = await checkIfPresaleStarted()
            if (started) {
                await checkIfPresaleEnded()
            }
        }, 5000)
    }

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: 'sepolia',
                providerOptions: {},
                disableInjectedProvider: false
            })
            onPageLoad()
        }
    }, [walletConnected])

    const connectWallet = async () => {
        await getProviderORSigner()

        setWalletConnected(true)
    }

    const getProviderORSigner = async (needSigner = false) => {
        try {
            const provider = await web3ModalRef.current.connect()
            const web3Provider = new providers.Web3Provider(provider)
            const { chainId } = await web3Provider.getNetwork()
            if (chainId !== 11155111) {
                alert("Please switch to sepolia")
            }

            if (needSigner) {
                const signer = web3Provider.getSigner()
                return signer
            }

            return web3Provider
        } catch (err) {
            console.error(err);
        }
    }

    function renderBody() {
        if (loading) {
            return <div>
                <span className={styles.description}>Loading...</span>
            </div>
        }

        if (!walletConnected) {
            return <button onClick={connectWallet} className={styles.button}>Connect Wallet</button>
        }

        if (isOwner && !presaleStarted) {
            return <button onClick={startPresale} className={styles.button}>Start presale</button>
        }

        if (!presaleStarted) {
            return <div>
                <span className={styles.description}>Presale has not started yet.</span>
            </div>
        }

        if (presaleStarted && !presaleEnded) {
            return <div>
                <span className={styles.description}>
                    Presale has started! If your address is whitelisted, you can mint a CryptoDev!
                </span>
                <button className={styles.button} onClick={() => mint("presale")}>
                    Presale Mint
                </button>
            </div>
        }

        if (presaleEnded) {
            return <div>
                <span className={styles.description}>
                    Presale has ended!
                    You can mint a CryptoDev in public sale, if any remain.
                </span>
                <button className={styles.button} onClick={() => mint("public")}>
                    Public Mint
                </button>
            </div>
        }
    }

    return (
        <div>
            <Head>
                <title>Crypto Devs NFT</title>
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
                    <div className={styles.description}>
                        It&#39;s an NFT collection for developers in Crypto.
                    </div>
                    <div className={styles.description}>
                        {numTokenMinted}/20 have been minted
                    </div>
                    {renderBody()}
                </div>
                <div>
                    <img className={styles.image} src="./cryptodevs/0.svg" />
                </div>
            </div>
        </div>
    )
}