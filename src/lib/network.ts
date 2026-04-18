import { defineChain, Address } from 'viem';
import { defineChain as defineThirdwebChain } from "thirdweb/chains";

// Thirdweb chain definitions for wallet UI components
export const monadChain = defineThirdwebChain({
    id: 143,
    name: "Monad Mainnet",
    nativeCurrency: {
        decimals: 18,
        name: "Monad",
        symbol: "MON",
    },
    rpc: "https://rpc3.monad.xyz",
});

export const bnbThirdwebChain = defineThirdwebChain({
    id: 56,
    name: "BNB Smart Chain",
    nativeCurrency: {
        decimals: 18,
        name: "BNB",
        symbol: "BNB",
    },
    rpc: "https://1rpc.io/bnb",
});

export const avalancheThirdwebChain = defineThirdwebChain({
    id: 43114,
    name: "Avalanche C-Chain",
    nativeCurrency: {
        decimals: 18,
        name: "Avalanche",
        symbol: "AVAX",
    },
    rpc: "https://avax.api.pocket.network",
});

export const polygonThirdwebChain = defineThirdwebChain({
    id: 137,
    name: "Polygon",
    nativeCurrency: {
        decimals: 18,
        name: "MATIC",
        symbol: "MATIC",
    },
    rpc: "https://polygon-rpc.com",
});

export const optimismThirdwebChain = defineThirdwebChain({
    id: 10,
    name: "Optimism",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpc: "https://optimism-public.nodies.app",
});

export const hyperliquidThirdwebChain = defineThirdwebChain({
    id: 999,
    name: "HyperLiquid",
    nativeCurrency: {
        decimals: 18,
        name: "HyperLiquid",
        symbol: "HYPE",
    },
    rpc: "https://hyperliquid.drpc.org",
});

export const ethereumThirdwebChain = defineThirdwebChain({
    id: 1,
    name: "Ethereum",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpc: "https://eth.llamarpc.com",
});

export const arbitrumThirdwebChain = defineThirdwebChain({
    id: 42161,
    name: "Arbitrum One",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpc: "https://arb1.arbitrum.io/rpc",
});

export const mantleThirdwebChain = defineThirdwebChain({
    id: 5000,
    name: "Mantle",
    nativeCurrency: {
        decimals: 18,
        name: "Mantle",
        symbol: "MNT",
    },
    rpc: "https://1rpc.io/mantle",
});

export const b3ThirdwebChain = defineThirdwebChain({
    id: 8333,
    name: "B3",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpc: "https://mainnet-rpc.b3.fun",
});

export const baseThirdwebChain = defineThirdwebChain({
    id: 8453,
    name: "Base",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpc: "https://mainnet.base.org",
});

// Custom chain def viem client

// Monad Mainnet
export const monadMainnet = defineChain({
    id: 143,
    name: 'Monad Mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Monad',
        symbol: 'MON',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc3.monad.xyz'],
        },
        public: {
            http: ['https://rpc3.monad.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Monad Explorer',
            url: 'https://mainnet-beta.monvision.io',
        },
    },
    testnet: false,
});

// BNB Smart Chain
export const bnbChain = defineChain({
    id: 56,
    name: 'BNB Smart Chain',
    nativeCurrency: {
        decimals: 18,
        name: 'BNB',
        symbol: 'BNB',
    },
    rpcUrls: {
        default: {
            http: ['https://1rpc.io/bnb'],
        },
        public: {
            http: ['https://1rpc.io/bnb'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BscScan',
            url: 'https://bscscan.com',
        },
    },
    testnet: false,
});

//  Avalanche C-Chain
export const avalancheChain = defineChain({
    id: 43114,
    name: 'Avalanche C-Chain',
    nativeCurrency: {
        decimals: 18,
        name: 'Avalanche',
        symbol: 'AVAX',
    },
    rpcUrls: {
        default: {
            http: ['https://avax.api.pocket.network'],
        },
        public: {
            http: ['https://avax.api.pocket.network'],
        },
    },
    blockExplorers: {
        default: {
            name: 'SnowTrace',
            url: 'https://snowtrace.io',
        },
    },
    testnet: false,
});

// Polygon Mainnet
export const polygonChain = defineChain({
    id: 137,
    name: 'Polygon',
    nativeCurrency: {
        decimals: 18,
        name: 'MATIC',
        symbol: 'MATIC',
    },
    rpcUrls: {
        default: {
            http: ['https://polygon.drpc.org'],
        },
        public: {
            http: ['https://polygon.drpc.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'PolygonScan',
            url: 'https://polygonscan.com',
        },
    },
    testnet: false,
});

// Define Optimism Mainnet
export const optimismChain = defineChain({
    id: 10,
    name: 'Optimism',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet.optimism.io'],
        },
        public: {
            http: ['https://mainnet.optimism.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Optimism Explorer',
            url: 'https://optimistic.etherscan.io',
        },
    },
    testnet: false,
});

// HyperLiquid Mainnet
export const hyperliquidChain = defineChain({
    id: 999,
    name: 'HyperLiquid',
    nativeCurrency: {
        decimals: 18,
        name: 'HyperLiquid',
        symbol: 'HYPE',
    },
    rpcUrls: {
        default: {
            http: ['https://hyperliquid.drpc.org'],
        },
        public: {
            http: ['https://hyperliquid.drpc.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'HyperLiquid Explorer',
            url: 'https://explorer.hyperliquid.xyz',
        },
    },
    testnet: false,
});

// Ethereum Mainnet
export const ethereumChain = defineChain({
    id: 1,
    name: 'Ethereum',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://eth.llamarpc.com'],
        },
        public: {
            http: ['https://eth.llamarpc.com'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Etherscan',
            url: 'https://etherscan.io',
        },
    },
    testnet: false,
});

// Arbitrum One
export const arbitrumChain = defineChain({
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://arb1.arbitrum.io/rpc'],
        },
        public: {
            http: ['https://arb1.arbitrum.io/rpc'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Arbiscan',
            url: 'https://arbiscan.io',
        },
    },
    testnet: false,
});

// Mantle Mainnet
export const mantleChain = defineChain({
    id: 5000,
    name: 'Mantle',
    nativeCurrency: {
        decimals: 18,
        name: 'Mantle',
        symbol: 'MNT',
    },
    rpcUrls: {
        default: {
            http: ['https://1rpc.io/mantle'],
        },
        public: {
            http: ['https://1rpc.io/mantle'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Mantle Explorer',
            url: 'https://explorer.mantle.xyz',
        },
    },
    testnet: false,
});

// B3 (Gaming L3 on Base)
export const b3Chain = defineChain({
    id: 8333,
    name: 'B3',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet-rpc.b3.fun'],
        },
        public: {
            http: ['https://mainnet-rpc.b3.fun'],
        },
    },
    blockExplorers: {
        default: {
            name: 'B3 Explorer',
            url: 'https://explorer.b3.fun',
        },
    },
    testnet: false,
});

// Base (Ethereum L2)
export const baseChain = defineChain({
    id: 8453,
    name: 'Base',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet.base.org'],
        },
        public: {
            http: ['https://mainnet.base.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'BaseScan',
            url: 'https://basescan.org',
        },
    },
    testnet: false,
});

// Network configuration type
export type NetworkConfig = {
    chain: typeof monadMainnet | typeof bnbChain | typeof avalancheChain | typeof polygonChain | typeof optimismChain | typeof hyperliquidChain | typeof ethereumChain | typeof arbitrumChain | typeof mantleChain | typeof b3Chain | typeof baseChain;
    bundlerUrl: string;
    entryPoint: Address;
    factoryAddress: Address;
    usdcAddress: Address;
    usdcDecimals: number;
    useDirectExecute?: boolean; // Bypass bundler - admin EOA calls execute() directly on smart wallet
};

// Network key type
export type NetworkKey = 'monad' | 'bnb' | 'avax' | 'polygon' | 'optimism' | 'hyperliquid' | 'ethereum' | 'arbitrum' | 'mantle' | 'b3' | 'base';

// Network configurations
export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
    monad: {
        chain: monadMainnet,
        bundlerUrl: 'https://api.pimlico.io/v2/143/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603' as Address,
        usdcDecimals: 6,
    },
    bnb: {
        chain: bnbChain,
        bundlerUrl: 'https://api.pimlico.io/v2/56/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address,
        usdcDecimals: 18,
    },
    avax: {
        chain: avalancheChain,
        bundlerUrl: 'https://api.pimlico.io/v2/43114/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as Address,
        usdcDecimals: 6,
    },
    polygon: {
        chain: polygonChain,
        bundlerUrl: 'https://api.pimlico.io/v2/137/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as Address,
        usdcDecimals: 6,
    },
    optimism: {
        chain: optimismChain,
        bundlerUrl: 'https://api.pimlico.io/v2/10/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as Address,
        usdcDecimals: 6,
    },
    hyperliquid: {
        chain: hyperliquidChain,
        bundlerUrl: 'https://api.pimlico.io/v2/999/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' as Address,
        usdcDecimals: 6,
    },
    ethereum: {
        chain: ethereumChain,
        bundlerUrl: 'https://api.pimlico.io/v2/1/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
        usdcDecimals: 6,
    },
    arbitrum: {
        chain: arbitrumChain,
        bundlerUrl: 'https://api.pimlico.io/v2/42161/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address,
        usdcDecimals: 6,
    },
    mantle: {
        chain: mantleChain,
        bundlerUrl: 'https://api.pimlico.io/v2/5000/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E',
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9' as Address,
        usdcDecimals: 6,
    },
    b3: {
        chain: b3Chain,
        bundlerUrl: `https://8333.bundler.thirdweb.com/${process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`,
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x2af198a85f9aa11cd6042a0596fbf23978514da3' as Address,
        usdcDecimals: 6,
    },
    base: {
        chain: baseChain,
        bundlerUrl: `https://8453.bundler.thirdweb.com/${process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`,
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789' as Address,
        factoryAddress: '0xdE320c2E2b4953883f61774c006f9057A55B97D1' as Address,
        usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
        usdcDecimals: 6,
    },
};

// Network display labels
export const NETWORK_LABELS: Record<NetworkKey, string> = {
    monad: 'Monad',
    bnb: 'BNB Smart Chain',
    avax: 'Avalanche',
    polygon: 'Polygon',
    optimism: 'Optimism',
    hyperliquid: 'HyperLiquid',
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    mantle: 'Mantle',
    b3: 'B3',
    base: 'Base',
};

// Network chain IDs
export const NETWORK_CHAIN_IDS: Record<NetworkKey, number> = {
    monad: 143,
    bnb: 56,
    avax: 43114,
    polygon: 137,
    optimism: 10,
    hyperliquid: 999,
    ethereum: 1,
    arbitrum: 42161,
    mantle: 5000,
    b3: 8333,
    base: 8453,
};

// Helper to get all networks sorted alphabetically by label
export function getNetworksSortedByLabel(): NetworkKey[] {
    return (Object.keys(NETWORK_LABELS) as NetworkKey[]).sort((a, b) =>
        NETWORK_LABELS[a].localeCompare(NETWORK_LABELS[b])
    );
}

// Map network keys to Thirdweb chains
export const THIRDWEB_CHAINS: Record<NetworkKey, ReturnType<typeof defineThirdwebChain>> = {
    monad: monadChain,
    bnb: bnbThirdwebChain,
    avax: avalancheThirdwebChain,
    polygon: polygonThirdwebChain,
    optimism: optimismThirdwebChain,
    hyperliquid: hyperliquidThirdwebChain,
    ethereum: ethereumThirdwebChain,
    arbitrum: arbitrumThirdwebChain,
    mantle: mantleThirdwebChain,
    b3: b3ThirdwebChain,
    base: baseThirdwebChain,
};
