// Deploys the P2P AccountFactory (0xdE320c2E2b4953883f61774c006f9057A55B97D1) on a new chain
// by replaying its original CREATE2 deployment through the deterministic deployer
// (0x4e59b44847b379578588920cA78FbF26c0B4956C). Same salt + init code => same factory
// address, so users' smart account addresses on the new chain match the ones they funded.
//
// Usage:
//   PRIVATE_KEY=0x... node scripts/deploy-factory.mjs <celo|zksync|robinhood> [--dry-run]
//
// The deployer key only pays gas; it gets no rights over the factory.

import { createPublicClient, createWalletClient, http, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const FACTORY = '0xdE320c2E2b4953883f61774c006f9057A55B97D1';
const CREATE2_DEPLOYER = '0x4e59b44847b379578588920cA78FbF26c0B4956C';
const ENTRY_POINT = '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789';

// Original factory deployment on Base
const SOURCE_RPC = 'https://mainnet.base.org';
const SOURCE_TX = '0x4d6d0a066f13ade9e4fe503f176e58de4261d2e5936a64d58fb10fe8afac8ef0';

const CHAINS = {
    celo: { id: 42220, name: 'Celo', rpc: 'https://forno.celo.org', symbol: 'CELO' },
    zksync: { id: 324, name: 'zkSync Era', rpc: 'https://mainnet.era.zksync.io', symbol: 'ETH' },
    robinhood: { id: 4663, name: 'Robinhood Chain', rpc: 'https://rpc.mainnet.chain.robinhood.com', symbol: 'ETH' },
};

const [networkKey, flag] = process.argv.slice(2);
const target = CHAINS[networkKey];
if (!target) {
    console.error(`Usage: PRIVATE_KEY=0x... node scripts/deploy-factory.mjs <${Object.keys(CHAINS).join('|')}> [--dry-run]`);
    process.exit(1);
}
const dryRun = flag === '--dry-run';

const chain = {
    id: target.id,
    name: target.name,
    nativeCurrency: { name: target.symbol, symbol: target.symbol, decimals: 18 },
    rpcUrls: { default: { http: [target.rpc] } },
};
const publicClient = createPublicClient({ chain, transport: http(target.rpc) });

const hasCode = async (address) => {
    const code = await publicClient.getCode({ address });
    return !!code && code !== '0x';
};

if (await hasCode(FACTORY)) {
    console.log(`Factory already deployed on ${target.name}. Nothing to do.`);
    process.exit(0);
}
for (const [label, address] of [['CREATE2 deployer', CREATE2_DEPLOYER], ['EntryPoint v0.6', ENTRY_POINT]]) {
    if (!(await hasCode(address))) {
        console.error(`${label} (${address}) is not deployed on ${target.name}; cannot reproduce the factory address.`);
        process.exit(1);
    }
}

const sourceClient = createPublicClient({ transport: http(SOURCE_RPC) });
const sourceTx = await sourceClient.getTransaction({ hash: SOURCE_TX });
if (getAddress(sourceTx.to) !== getAddress(CREATE2_DEPLOYER)) {
    console.error('Source transaction is not a CREATE2 deployer call');
    process.exit(1);
}
const data = sourceTx.input;

// The deterministic deployer returns the created address; check it before spending gas
const { data: simulated } = await publicClient.call({ to: CREATE2_DEPLOYER, data });
const simulatedAddress = simulated && getAddress(`0x${simulated.slice(-40)}`);
if (simulatedAddress !== getAddress(FACTORY)) {
    console.error(`Simulation produced ${simulatedAddress ?? 'nothing'}, expected ${FACTORY}. Aborting.`);
    process.exit(1);
}
console.log(`Simulation OK: factory would be created at ${FACTORY} on ${target.name}`);
if (dryRun) process.exit(0);

if (!process.env.PRIVATE_KEY) {
    console.error('PRIVATE_KEY env var is required to send the deployment');
    process.exit(1);
}
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain, transport: http(target.rpc) });

const gas = await publicClient.estimateGas({ account, to: CREATE2_DEPLOYER, data });
const gasPrice = await publicClient.getGasPrice();
console.log(`Deploying from ${account.address}: gas ${gas}, est. cost ${Number(gas * gasPrice) / 1e18} ${target.symbol}`);

const hash = await walletClient.sendTransaction({ to: CREATE2_DEPLOYER, data, gas: (gas * 12n) / 10n });
console.log(`Sent: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
// Load-balanced RPCs can lag a block behind the receipt, so retry the code check briefly
let deployed = false;
for (let i = 0; receipt.status === 'success' && !deployed && i < 10; i++) {
    deployed = await hasCode(FACTORY);
    if (!deployed) await new Promise((r) => setTimeout(r, 2000));
}
if (!deployed) {
    console.error(`Deployment failed (status ${receipt.status})`);
    process.exit(1);
}
console.log(`Factory deployed on ${target.name} at ${FACTORY}`);
