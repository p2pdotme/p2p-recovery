import { createPublicClient, http, getContractAddress, isAddressEqual, type Address, type Hex } from 'viem';
import { prepareTransaction, sendAndConfirmTransaction } from 'thirdweb';
import type { Wallet } from 'thirdweb/wallets';
import { NETWORKS, THIRDWEB_CHAINS, type NetworkKey } from './network';
import { client } from './thirdwebClient';

// Deterministic deployment proxy; its calldata is a 32-byte salt followed by the init code
const CREATE2_DEPLOYER = '0x4e59b44847b379578588920cA78FbF26c0B4956C' as Address;

// Original factory deployment on Base, replayed on chains where the factory is missing
const SOURCE_RPC = 'https://mainnet.base.org';
const SOURCE_TX = '0x4d6d0a066f13ade9e4fe503f176e58de4261d2e5936a64d58fb10fe8afac8ef0' as Hex;

const SALT_HEX_LENGTH = 64;
const CODE_POLL_ATTEMPTS = 10;
const CODE_POLL_DELAY_MS = 2000;

function getPublicClient(networkKey: NetworkKey) {
    const network = NETWORKS[networkKey];
    return createPublicClient({
        chain: network.chain,
        transport: http(network.chain.rpcUrls.default.http[0]),
    });
}

async function hasCode(networkKey: NetworkKey, address: Address): Promise<boolean> {
    const code = await getPublicClient(networkKey).getCode({ address });
    return !!code && code !== '0x';
}

// True when the account factory has code on the network. Throws if the RPC can't be reached.
export function isFactoryDeployed(networkKey: NetworkKey): Promise<boolean> {
    return hasCode(networkKey, NETWORKS[networkKey].factoryAddress);
}

// Load-balanced RPCs can lag a block behind a receipt, so poll for the code briefly
async function waitForFactory(networkKey: NetworkKey): Promise<boolean> {
    for (let i = 0; i < CODE_POLL_ATTEMPTS; i++) {
        if (await isFactoryDeployed(networkKey)) return true;
        if (i < CODE_POLL_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, CODE_POLL_DELAY_MS));
        }
    }
    return false;
}

// Fetch the original deployment calldata and prove it creates the expected factory.
// The CREATE2 address commits to the salt and init code, so the calldata needs no further trust.
async function getFactoryDeploymentData(factoryAddress: Address): Promise<Hex> {
    const sourceClient = createPublicClient({ transport: http(SOURCE_RPC) });
    const sourceTx = await sourceClient.getTransaction({ hash: SOURCE_TX });
    const data = sourceTx.input;

    const salt = `0x${data.slice(2, 2 + SALT_HEX_LENGTH)}` as Hex;
    const bytecode = `0x${data.slice(2 + SALT_HEX_LENGTH)}` as Hex;
    const created = getContractAddress({ opcode: 'CREATE2', from: CREATE2_DEPLOYER, salt, bytecode });
    if (!isAddressEqual(created, factoryAddress)) {
        throw new Error(`Factory deployment data does not match ${factoryAddress}; refusing to deploy`);
    }
    return data;
}

// Deploy the account factory on a network from the connected wallet, by replaying its
// original CREATE2 deployment. Same salt + init code => same factory address, so smart
// account addresses match the ones users funded. The wallet only pays gas.
export async function deployFactoryWithWallet(
    wallet: Wallet,
    networkKey: NetworkKey
): Promise<{ txHash?: string }> {
    const network = NETWORKS[networkKey];
    const chain = THIRDWEB_CHAINS[networkKey];
    const chainName = network.chain.name;

    if (await isFactoryDeployed(networkKey)) {
        return {};
    }
    for (const [label, address] of [['CREATE2 deployer', CREATE2_DEPLOYER], ['EntryPoint', network.entryPoint]] as const) {
        if (!(await hasCode(networkKey, address))) {
            throw new Error(`${label} (${address}) is not deployed on ${chainName}, so the factory cannot be deployed there`);
        }
    }

    const data = await getFactoryDeploymentData(network.factoryAddress);

    if (wallet.getChain()?.id !== chain.id) {
        await wallet.switchChain(chain);
    }
    const account = wallet.getAccount();
    if (!account) {
        throw new Error('Wallet not connected');
    }

    const receipt = await sendAndConfirmTransaction({
        account,
        transaction: prepareTransaction({ client, chain, to: CREATE2_DEPLOYER, data }),
    });
    if (receipt.status !== 'success') {
        throw new Error(`Factory deployment reverted: ${receipt.transactionHash}`);
    }
    if (!(await waitForFactory(networkKey))) {
        throw new Error(`Factory code not found on ${chainName} after transaction ${receipt.transactionHash}`);
    }
    return { txHash: receipt.transactionHash };
}
