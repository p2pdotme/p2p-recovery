'use client'

import { useState, useEffect } from 'react'
import { Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
    deriveSmartAccountAddress,
    isAccountDeployed,
    transferWithPrivateKey,
} from '@/lib/smart-account'
import {
    NETWORKS,
    NETWORK_LABELS,
    NETWORK_CHAIN_IDS,
    getNetworksSortedByLabel,
    type NetworkKey,
} from '@/lib/network'
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    ChevronDown,
    Copy,
    Eye,
    EyeOff,
    Loader2,
    X,
} from 'lucide-react'

interface TokenInfo {
    symbol: string
    name: string
    address: string
    balance: string
    balanceRaw: string
    decimals: number
    imgUrl?: string
    balanceUSD?: number
}

export function PrivateKeyRecovery() {
    const [privateKey, setPrivateKey] = useState('')
    const [showKey, setShowKey] = useState(false)
    const [network, setNetwork] = useState<NetworkKey>('monad')
    const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)

    const [eoaAddress, setEoaAddress] = useState('')
    const [smartAccountAddress, setSmartAccountAddress] = useState('')
    const [isDeployed, setIsDeployed] = useState<boolean | null>(null)
    const [deriving, setDeriving] = useState(false)
    const [deriveError, setDeriveError] = useState('')

    const [tokens, setTokens] = useState<TokenInfo[]>([])
    const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null)
    const [showTokenSelector, setShowTokenSelector] = useState(false)
    const [isLoadingTokens, setIsLoadingTokens] = useState(false)

    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [txHash, setTxHash] = useState('')

    const [showFundingModal, setShowFundingModal] = useState(false)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.pk-network-selector')) setShowNetworkDropdown(false)
            if (!target.closest('.pk-token-selector')) setShowTokenSelector(false)
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const isValidKey = (() => {
        const k = privateKey.trim().startsWith('0x') ? privateKey.trim() : `0x${privateKey.trim()}`
        return /^0x[a-fA-F0-9]{64}$/.test(k)
    })()

    const handleDerive = async () => {
        setDeriveError('')
        setError('')
        setSuccess('')
        setTxHash('')
        setTokens([])
        setSelectedToken(null)
        setEoaAddress('')
        setSmartAccountAddress('')
        setIsDeployed(null)

        if (!isValidKey) {
            setDeriveError('Invalid private key. Must be 64 hex characters.')
            return
        }

        setDeriving(true)
        try {
            const raw = privateKey.trim()
            const key = (raw.startsWith('0x') ? raw : `0x${raw}`) as `0x${string}`
            const signer = privateKeyToAccount(key)
            const networkConfig = NETWORKS[network]

            const smart = await deriveSmartAccountAddress(
                signer.address,
                networkConfig.factoryAddress,
                '0x',
                network
            )
            setEoaAddress(signer.address)
            setSmartAccountAddress(smart)

            const deployed = await isAccountDeployed(smart, network)
            setIsDeployed(deployed)

            await fetchTokens(smart)
        } catch (err) {
            setDeriveError((err as Error)?.message || 'Failed to derive smart account')
        } finally {
            setDeriving(false)
        }
    }

    const fetchTokens = async (address: string) => {
        setIsLoadingTokens(true)
        try {
            const networkConfig = NETWORKS[network]
            const response = await fetch('/api/tokenfetch/nativeandusdc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, chainId: networkConfig.chain.id }),
            })
            if (!response.ok) throw new Error('Failed to fetch tokens')
            const data = await response.json()
            const fetched: TokenInfo[] = data.tokens || []
            setTokens(fetched)
            const usdc = fetched.find(
                (t) => t.address.toLowerCase() === networkConfig.usdcAddress.toLowerCase()
            )
            if (usdc) setSelectedToken(usdc)
            else if (fetched.length > 0) setSelectedToken(fetched[0])
        } catch (err) {
            console.error('Error fetching tokens:', err)
        } finally {
            setIsLoadingTokens(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setSuccess('Address copied to clipboard!')
        setTimeout(() => setSuccess(''), 2000)
    }

    const handleSend = async () => {
        setError('')
        setSuccess('')
        setTxHash('')

        if (!smartAccountAddress) {
            setError('Derive your smart account first')
            return
        }
        if (!selectedToken) {
            setError('Select a token to send')
            return
        }
        if (!recipient.startsWith('0x') || recipient.length !== 42) {
            setError('Invalid recipient address')
            return
        }
        if (!amount || parseFloat(amount) <= 0) {
            setError('Invalid amount')
            return
        }

        const multiplier = Math.pow(10, selectedToken.decimals)
        const transferAmount = BigInt(Math.round(parseFloat(amount) * multiplier))
        const currentBalance = BigInt(Math.round(parseFloat(selectedToken.balance) * multiplier))

        if (transferAmount > currentBalance) {
            setError(`Insufficient balance. You have ${selectedToken.balance} ${selectedToken.symbol}`)
            return
        }

        setIsSending(true)
        try {
            const result = await transferWithPrivateKey({
                privateKey: privateKey.trim(),
                recipient: recipient as Address,
                amount: transferAmount,
                tokenAddress: selectedToken.address as Address,
                decimals: selectedToken.decimals,
                networkKey: network,
            })

            if (result.success) {
                setTxHash(result.txHash || '')
                setSuccess(
                    `Transfer successful! ${amount} ${selectedToken.symbol} sent to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`
                )
                setAmount('')
                setRecipient('')
                if (smartAccountAddress) await fetchTokens(smartAccountAddress)
                setIsDeployed(true)
            } else if (result.error === 'PREFUND_REQUIRED') {
                setShowFundingModal(true)
            } else {
                setError(result.error || 'Transfer failed')
            }
        } catch (err) {
            setError((err as Error).message || 'Transfer failed')
        } finally {
            setIsSending(false)
        }
    }

    const networkConfig = NETWORKS[network]

    return (
        <div className="space-y-6">
            {/* Security Warning */}
            <div className="flex items-start gap-3 p-4 bg-warning-light dark:bg-warning-dark/20 border border-warning/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-warning" />
                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    <p className="font-semibold mb-1">Security Notice</p>
                    <p>
                        Your private key never leaves your browser. Only paste keys you control. Prefer the main
                        Token Recovery flow (wallet connect) whenever possible — this page is a fallback for users
                        who only hold a raw private key.
                    </p>
                </div>
            </div>

            {/* Network Selector */}
            <div className="relative pk-network-selector bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-soft">
                <span className="px-3 py-1 bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-medium rounded-full border border-brand-500/20">
                    Network
                </span>
                <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50 mt-2 mb-4">
                    Select Network
                </h3>
                <button
                    onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-brand-500 dark:hover:border-brand-400 transition-colors"
                >
                    <div className="text-left">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {NETWORK_LABELS[network]}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Chain ID: {NETWORK_CHAIN_IDS[network]}
                        </div>
                    </div>
                    <ChevronDown
                        className={`w-5 h-5 text-neutral-400 transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`}
                    />
                </button>
                {showNetworkDropdown && (
                    <div className="mt-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shadow-medium">
                        {getNetworksSortedByLabel().map((k, i, arr) => (
                            <button
                                key={k}
                                onClick={() => {
                                    setNetwork(k)
                                    setShowNetworkDropdown(false)
                                    setEoaAddress('')
                                    setSmartAccountAddress('')
                                    setTokens([])
                                    setSelectedToken(null)
                                    setIsDeployed(null)
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${i < arr.length - 1 ? 'border-b border-neutral-200 dark:border-neutral-700' : ''} ${network === k ? 'bg-brand-50 dark:bg-brand-950/30' : ''}`}
                            >
                                <div className="font-medium text-neutral-900 dark:text-neutral-50">
                                    {NETWORK_LABELS[k]}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Chain ID: {NETWORK_CHAIN_IDS[k]}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Private Key Input */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-soft">
                <span className="px-3 py-1 bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-medium rounded-full border border-brand-500/20">
                    Step 1
                </span>
                <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50 mt-2 mb-4">
                    Enter Private Key
                </h3>

                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="0x... or 64 hex characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full px-4 py-2.5 pr-12 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors"
                    >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                <button
                    onClick={handleDerive}
                    disabled={!isValidKey || deriving}
                    className="mt-4 w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: deriving ? '#d6d6d7' : '#8984d9' }}
                >
                    {deriving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Deriving...</span>
                        </>
                    ) : (
                        <>
                            Derive Smart Account
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>

                {deriveError && (
                    <div className="flex items-start gap-3 p-3 mt-4 bg-error-light dark:bg-error-dark/20 border border-error/30 rounded-lg text-error-dark dark:text-error-light">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium break-all flex-1">{deriveError}</p>
                    </div>
                )}
            </div>

            {/* Derived addresses */}
            {smartAccountAddress && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-soft">
                    <span className="px-3 py-1 bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-medium rounded-full border border-brand-500/20">
                        Step 2
                    </span>
                    <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50 mt-2 mb-4">
                        Your Accounts
                    </h3>

                    <div className="space-y-3">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                    Owner (EOA)
                                </p>
                                <button
                                    onClick={() => copyToClipboard(eoaAddress)}
                                    className="p-1 text-neutral-500 hover:text-brand-500 transition-colors"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-neutral-900 dark:text-neutral-50 font-mono text-xs break-all">
                                {eoaAddress}
                            </p>
                        </div>

                        <div className="p-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-lg">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                    Smart Account
                                </p>
                                <div className="flex items-center gap-2">
                                    {isDeployed !== null && (
                                        <span
                                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                                isDeployed
                                                    ? 'bg-success/20 text-success-dark dark:text-success-light'
                                                    : 'bg-warning/20 text-warning-dark dark:text-warning-light'
                                            }`}
                                        >
                                            {isDeployed ? 'Deployed' : 'Not deployed'}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => copyToClipboard(smartAccountAddress)}
                                        className="p-1 text-neutral-500 hover:text-brand-500 transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-neutral-900 dark:text-neutral-50 font-mono text-xs break-all">
                                {smartAccountAddress}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Form */}
            {smartAccountAddress && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 md:p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <span className="px-3 py-1 bg-info/10 text-info-dark dark:text-info text-xs font-medium rounded-full border border-info/20">
                                Step 3
                            </span>
                            <h3 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-50 mt-2">
                                Withdraw Tokens
                            </h3>
                        </div>
                        {isLoadingTokens && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="hidden sm:inline">Loading tokens...</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Token selector */}
                        {tokens.length > 0 && (
                            <div className="pk-token-selector">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Select Token
                                </label>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTokenSelector(!showTokenSelector)}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-left flex items-center justify-between hover:border-brand-500 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {selectedToken?.imgUrl && (
                                                <img
                                                    src={selectedToken.imgUrl}
                                                    alt={selectedToken.symbol}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                    {selectedToken?.symbol || 'Select Token'}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {selectedToken ? `Balance: ${parseFloat(selectedToken.balance).toFixed(6)}` : '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`w-5 h-5 text-neutral-400 transition-transform ${showTokenSelector ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {showTokenSelector && (
                                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {tokens.map((token, index) => (
                                                <button
                                                    key={`${token.address}-${index}`}
                                                    onClick={() => {
                                                        setSelectedToken(token)
                                                        setShowTokenSelector(false)
                                                    }}
                                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {token.imgUrl && (
                                                            <img
                                                                src={token.imgUrl}
                                                                alt={token.symbol}
                                                                className="w-6 h-6 rounded-full"
                                                            />
                                                        )}
                                                        <div className="text-left">
                                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                                {token.symbol}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                {token.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                        {parseFloat(token.balance).toFixed(4)}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Balance */}
                        {selectedToken && (
                            <div className="p-4 bg-gradient-to-br from-success-light to-success-light/50 dark:from-success-dark/20 dark:to-success-dark/10 rounded-lg border border-success/20">
                                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                    Available Balance
                                </p>
                                <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
                                    {parseFloat(selectedToken.balance).toFixed(4)}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                    {selectedToken.symbol} on {NETWORK_LABELS[network]}
                                </p>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Amount ({selectedToken?.symbol || 'Token'})
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="any"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                {selectedToken && (
                                    <button
                                        onClick={() => setAmount(selectedToken.balance)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-white rounded-md"
                                        style={{ backgroundColor: '#8984d9' }}
                                    >
                                        Max
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Recipient */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Recipient Address
                            </label>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="0x..."
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setRecipient(eoaAddress)}
                                className="mt-3 w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Use Owner Address
                            </button>
                        </div>

                        {/* Send */}
                        <button
                            onClick={handleSend}
                            disabled={isSending}
                            className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-base shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{ backgroundColor: isSending ? '#d6d6d7' : '#8984d9' }}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                                    <span className="text-neutral-600">Processing...</span>
                                </>
                            ) : (
                                <>
                                    Send {selectedToken?.symbol || 'Token'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Tx hash */}
                        {txHash && (
                            <div className="p-4 bg-success-light dark:bg-success-dark/20 border border-success/30 rounded-lg">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                        Transaction Hash
                                    </p>
                                    <a
                                        href={`${networkConfig.chain.blockExplorers?.default.url}/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success border border-success/30 rounded-md hover:bg-success-dark transition-colors text-xs font-medium text-white"
                                    >
                                        View
                                    </a>
                                </div>
                                <p className="text-xs text-neutral-900 dark:text-neutral-50 font-mono break-all">
                                    {txHash}
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-error-light dark:bg-error-dark/20 border border-error/30 rounded-lg text-error-dark dark:text-error-light mt-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium break-all flex-1">{error}</p>
                        </div>
                    )}
                    {success && !error && (
                        <div className="flex items-start gap-3 p-4 bg-success-light dark:bg-success-dark/20 border border-success/30 rounded-lg text-success-dark dark:text-success-light mt-4">
                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium break-all flex-1">{success}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Funding modal */}
            {showFundingModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-md w-full p-6 relative shadow-strong">
                        <button
                            onClick={() => setShowFundingModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </button>

                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-warning/10 border border-warning/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-warning" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 text-center mb-2">
                            Fund Smart Account
                        </h3>
                        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-5">
                            Your smart account needs {networkConfig.chain.nativeCurrency.symbol} to pay for gas on{' '}
                            {NETWORK_LABELS[network]}.
                        </p>

                        <div className="bg-warning-light dark:bg-warning-dark/20 border border-warning/30 rounded-lg p-4 mb-4">
                            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                Send {networkConfig.chain.nativeCurrency.symbol} to:
                            </p>
                            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 mb-3">
                                <p className="text-neutral-900 dark:text-neutral-50 font-mono text-xs break-all">
                                    {smartAccountAddress}
                                </p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(smartAccountAddress)}
                                className="w-full px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
                                style={{ backgroundColor: '#8984d9' }}
                            >
                                <Copy className="w-4 h-4" />
                                Copy Address
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFundingModal(false)}
                            className="w-full px-4 py-2.5 text-neutral-900 dark:text-neutral-50 text-sm font-semibold rounded-lg transition-colors"
                            style={{ backgroundColor: '#d6d6d7' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
