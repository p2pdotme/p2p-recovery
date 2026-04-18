import {
    createPublicClient,
    http,
    encodeFunctionData,
    keccak256,
    encodeAbiParameters,
    toHex,
    parseAbi,
    Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS, type NetworkKey } from './network';
import type { Wallet } from 'thirdweb/wallets';
import { client } from './thirdwebClient';


// Shared types
export type UserOp = {
    sender: Address;
    nonce: bigint;
    initCode: `0x${string}`;
    callData: `0x${string}`;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    paymasterAndData: `0x${string}`;
    signature: `0x${string}`;
};

type HandledError = Error & { isHandled?: boolean; name?: string };

// Contract ABIs
export const ENTRY_POINT_ABI = [
    {
        inputs: [
            { name: 'sender', type: 'address' },
            { name: 'key', type: 'uint192' }
        ],
        name: 'getNonce',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export const ERC20_ABI = parseAbi([
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
]);

export const SMART_ACCOUNT_ABI = parseAbi([
    'function execute(address dest, uint256 value, bytes calldata func)',
    'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func)',
]);

// Account Factory ABI for deriving smart account address
export const ACCOUNT_FACTORY_ABI = [
    {
        name: 'getAddress',
        type: 'function',
        inputs: [
            { name: 'admin', type: 'address' },
            { name: 'data', type: 'bytes' }
        ],
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view'
    },
    {
        name: 'createAccount',
        type: 'function',
        inputs: [
            { name: 'admin', type: 'address' },
            { name: 'data', type: 'bytes' }
        ],
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'nonpayable'
    }
] as const;

// Helper function to derive smart account address
export async function deriveSmartAccountAddress(
    adminAddress: Address,
    factoryAddress: Address,
    data: `0x${string}` = '0x',
    networkKey: NetworkKey = 'monad'
): Promise<Address> {
    const network = NETWORKS[networkKey];
    const publicClient = createPublicClient({
        chain: network.chain,
        transport: http(network.chain.rpcUrls.default.http[0]),
    });

    try {
        // First check if the contract exists at the address
        const code = await publicClient.getBytecode({ address: factoryAddress });
        if (!code || code === '0x') {
            const error: HandledError = new Error('Factory not deployed on this network yet');
            error.isHandled = true;
            throw error;
        }

        const smartAccountAddress = await publicClient.readContract({
            address: factoryAddress,
            abi: ACCOUNT_FACTORY_ABI,
            functionName: 'getAddress',
            args: [adminAddress, data],
        });

        // Check if the result is valid (not empty)
        if (!smartAccountAddress || smartAccountAddress === '0x' || smartAccountAddress === '0x0000000000000000000000000000000000000000') {
            const error: HandledError = new Error('Factory not deployed on this network yet');
            error.isHandled = true;
            throw error;
        }

        return smartAccountAddress as Address;
    } catch (error) {
        const err = error as HandledError;
        if (err.isHandled) {
            throw err;
        }
        // Just handle all errors
        if (err?.message?.includes('returned no data') ||
            err?.message?.includes('does not have the function') ||
            err?.message?.includes('address is not a contract') ||
            err?.name === 'ContractFunctionExecutionError') {
            const friendlyError: HandledError = new Error('Factory not deployed on this network yet');
            friendlyError.isHandled = true;
            throw friendlyError;
        }

        const genericError: HandledError = new Error('Failed to derive smart account address');
        genericError.isHandled = true;
        throw genericError;
    }
}



// Helper to sign userOpHash using the connected thirdweb wallet/address
export async function signUserOpHashWithThirdwebWallet(
    wallet: Wallet,
    userOpHash: `0x${string}`
): Promise<`0x${string}`> {
    // Get the owner/admin account from the wallet (the account that controls the smart account)
    let ownerAccount = null;

    // Try getAdminAccount first (for smart accounts, this gets the owner)
    if (wallet.getAdminAccount) {
        try {
            ownerAccount = await wallet.getAdminAccount();
        } catch {
            // Fall through to getAccount
        }
    }

    // Fallback to getAccount (the connected wallet account)
    if (!ownerAccount) {
        ownerAccount = wallet.getAccount();
    }

    if (!ownerAccount) {
        throw new Error('No owner account found in wallet');
    }

    // Sign using owner account's signMessage
    try {
        const sig = await ownerAccount.signMessage({
            message: { raw: userOpHash },
        });
        if (typeof sig === "string" && sig.startsWith("0x")) {
            return sig as `0x${string}`;
        }
    } catch {
        // Fall through to error
    }

    throw new Error(
        `Unable to get raw signature for ERC-4337 UserOperation from owner account ${ownerAccount.address}. ` +
        "checks for lgs."
    );
}

// Pack UserOperation for hashing (ERC-4337 v0.6)
function packUserOp(userOp: UserOp) {
    return encodeAbiParameters(
        [
            { type: 'address' },
            { type: 'uint256' },
            { type: 'bytes32' },
            { type: 'bytes32' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'bytes32' },
        ],
        [
            userOp.sender,
            userOp.nonce,
            keccak256(userOp.initCode),
            keccak256(userOp.callData),
            userOp.callGasLimit,
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
            userOp.maxFeePerGas,
            userOp.maxPriorityFeePerGas,
            keccak256(userOp.paymasterAndData),
        ]
    );
}

// Calculate UserOperation hash
export function getUserOpHash(userOp: UserOp, entryPoint: Address, chainId: number) {
    const packed = packUserOp(userOp);
    const userOpHash = keccak256(packed);

    return keccak256(
        encodeAbiParameters(
            [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
            [userOpHash, entryPoint, BigInt(chainId)]
        )
    );
}

// Format UserOp for bundler (convert BigInts to hex strings)
export function formatUserOpForBundler(userOp: UserOp) {
    return {
        sender: userOp.sender,
        nonce: toHex(userOp.nonce),
        initCode: userOp.initCode,
        callData: userOp.callData,
        callGasLimit: toHex(userOp.callGasLimit),
        verificationGasLimit: toHex(userOp.verificationGasLimit),
        preVerificationGas: toHex(userOp.preVerificationGas),
        maxFeePerGas: toHex(userOp.maxFeePerGas),
        maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
        paymasterAndData: userOp.paymasterAndData,
        signature: userOp.signature,
    };
}

// JSON-RPC call helper
export async function bundlerRpc(method: string, params: unknown[], bundlerRpcUrl: string) {
    const response = await fetch(bundlerRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params,
        }),
    });

    const data = await response.json();
    if (data.error) {
        throw new Error(`Bundler RPC Error: ${JSON.stringify(data.error)}`);
    }
    return data.result;
}

// Get Thirdweb Paymaster data for sponsored transactions
export async function getThirdwebPaymasterData(
    userOp: UserOp,
    entryPoint: Address,
    chainId: number
): Promise<{ paymasterAndData: `0x${string}` }> {
    try {
        const clientId = client.clientId;
        if (!clientId) {
            console.warn('No Thirdweb client ID found, skipping paymaster');
            return { paymasterAndData: '0x' as `0x${string}` };
        }

        // Thirdweb paymaster endpoint
        const paymasterUrl = `https://${chainId}.bundler.thirdweb.com/${clientId}`;

        const response = await fetch(paymasterUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'pm_sponsorUserOperation',
                params: [
                    {
                        sender: userOp.sender,
                        nonce: toHex(userOp.nonce),
                        initCode: userOp.initCode,
                        callData: userOp.callData,
                        callGasLimit: toHex(userOp.callGasLimit),
                        verificationGasLimit: toHex(userOp.verificationGasLimit),
                        preVerificationGas: toHex(userOp.preVerificationGas),
                        maxFeePerGas: toHex(userOp.maxFeePerGas),
                        maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
                    },
                    entryPoint,
                ],
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.warn('Paymaster sponsorship failed:', data.error);
            return { paymasterAndData: '0x' as `0x${string}` };
        }

        if (data.result?.paymasterAndData) {
            console.log('Gas sponsored by Thirdweb paymaster');
            return { paymasterAndData: data.result.paymasterAndData as `0x${string}` };
        }

        return { paymasterAndData: '0x' as `0x${string}` };
    } catch (error) {
        console.warn('Error getting paymaster data:', error);
        return { paymasterAndData: '0x' as `0x${string}` };
    }
}

// Get token balance
export async function getTokenBalance(
    tokenAddress: Address,
    accountAddress: Address,
    networkKey: NetworkKey = 'monad'
): Promise<bigint> {
    const network = NETWORKS[networkKey];
    const publicClient = createPublicClient({
        chain: network.chain,
        transport: http(network.chain.rpcUrls.default.http[0]),
    });

    const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [accountAddress],
    });

    return balance;
}

// Check if smart account is deployed
export async function isAccountDeployed(
    accountAddress: Address,
    networkKey: NetworkKey
): Promise<boolean> {
    const network = NETWORKS[networkKey];
    const publicClient = createPublicClient({
        chain: network.chain,
        transport: http(network.chain.rpcUrls.default.http[0]),
    });

    try {
        const code = await publicClient.getBytecode({ address: accountAddress });
        return !!(code && code !== '0x');
    } catch (error) {
        console.error('Error checking account deployment:', error);
        return false;
    }
}

// Generate initCode for account deployment
export function getInitCode(factoryAddress: Address, ownerAddress: Address): `0x${string}` {
    const createAccountCallData = encodeFunctionData({
        abi: parseAbi(['function createAccount(address owner, bytes data) returns (address)']),
        functionName: 'createAccount',
        args: [ownerAddress, '0x'], // Empty bytes for data parameter
    });

    // initCode = factory address + createAccount calldata
    return (factoryAddress.toLowerCase() + createAccountCallData.slice(2)) as `0x${string}`;
}

// Deploy smart account
export async function deploySmartAccount(
    privateKey: string,
    smartAccountAddress: Address,
    networkKey: NetworkKey = 'monad'
): Promise<{ success: boolean; txHash?: string; userOpHash?: string; error?: string }> {
    try {
        const network = NETWORKS[networkKey];
        const signer = privateKeyToAccount(privateKey as `0x${string}`);

        // Check if already deployed
        const deployed = await isAccountDeployed(smartAccountAddress, networkKey);
        if (deployed) {
            return { success: false, error: 'Account is already deployed' };
        }

        // Create public client
        const publicClient = createPublicClient({
            chain: network.chain,
            transport: http(network.chain.rpcUrls.default.http[0]),
        });

        // Generate initCode
        const initCode = getInitCode(network.factoryAddress, signer.address);

        // Get nonce
        const nonce = await publicClient.readContract({
            address: network.entryPoint,
            abi: ENTRY_POINT_ABI,
            functionName: 'getNonce',
            args: [smartAccountAddress, 0n],
        });

        // Get gas prices from Pimlico
        let maxFeePerGas: bigint;
        let maxPriorityFeePerGas: bigint;

        try {
            const gasPrices = await bundlerRpc('pimlico_getUserOperationGasPrice', [], network.bundlerUrl);
            maxFeePerGas = BigInt(gasPrices.standard.maxFeePerGas);
            maxPriorityFeePerGas = BigInt(gasPrices.standard.maxPriorityFeePerGas);
        } catch {
            console.warn('Failed to get bundler gas prices, using fallback');
            maxFeePerGas = 1500000000n; // 1.5 gwei minimum
            maxPriorityFeePerGas = 1500000000n;
        }

        // Dummy signature for gas estimation
        const DUMMY_SIG = '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

        // Build UserOperation for deployment (empty callData - just deploy)
        const userOp: UserOp = {
            sender: smartAccountAddress,
            nonce: nonce,
            initCode: initCode,
            callData: '0x' as `0x${string}`, // Empty call - just deploy
            callGasLimit: 100000n,
            verificationGasLimit: 1000000n, // Higher for deployment
            preVerificationGas: 600000n, // Increased from 500000n
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            paymasterAndData: '0x' as `0x${string}`,
            signature: DUMMY_SIG as `0x${string}`,
        };

        // Estimate gas
        try {
            const gasEstimate = await bundlerRpc('eth_estimateUserOperationGas', [
                formatUserOpForBundler(userOp),
                network.entryPoint,
            ], network.bundlerUrl);

            if (gasEstimate) {
                userOp.callGasLimit = BigInt(gasEstimate.callGasLimit || '0x186a0');
                userOp.verificationGasLimit = BigInt(gasEstimate.verificationGasLimit || '0xf4240');
                // Ensure preVerificationGas is at least 600000 or the estimated value, whichever is higher
                const estimatedPreVerificationGas = BigInt(gasEstimate.preVerificationGas || '0x927c0');
                userOp.preVerificationGas = estimatedPreVerificationGas > 600000n ? estimatedPreVerificationGas : 600000n;
            }
        } catch (e) {
            console.warn('Gas estimation failed, using defaults:', (e as Error).message);
        }

        // Sign UserOperation
        userOp.signature = '0x' as `0x${string}`;
        const userOpHash = getUserOpHash(userOp, network.entryPoint, network.chain.id);
        const signature = await signer.signMessage({
            message: { raw: userOpHash },
        });
        userOp.signature = signature;

        // Submit to bundler
        const formattedUserOp = formatUserOpForBundler(userOp);
        const userOpHashResult = await bundlerRpc('eth_sendUserOperation', [
            formattedUserOp,
            network.entryPoint,
        ], network.bundlerUrl);

        // Wait for receipt
        let receipt: { success?: boolean; receipt?: { transactionHash?: string } } | null = null;
        let attempts = 0;

        while (!receipt && attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                receipt = await bundlerRpc('eth_getUserOperationReceipt', [userOpHashResult], network.bundlerUrl);
            } catch {
                // Receipt not ready yet
            }
            attempts++;
        }

        if (receipt && receipt.success) {
            return {
                success: true,
                txHash: receipt.receipt?.transactionHash,
                userOpHash: userOpHashResult
            };
        } else {
            return {
                success: false,
                error: 'Deployment transaction pending or failed',
                userOpHash: userOpHashResult
            };
        }

    } catch (error) {
        console.error('Error deploying smart account:', error);
        return {
            success: false,
            error: (error as Error).message || 'Failed to deploy smart account'
        };
    }
}

// Transfer tokens from a smart account using a raw private key
// Supports native tokens (tokenAddress = zero address) and ERC-20s.
// Handles account deployment automatically by including initCode when needed.
export async function transferWithPrivateKey(params: {
    privateKey: string;
    recipient: Address;
    amount: bigint;
    tokenAddress: Address; // zero address for native
    decimals: number;
    networkKey: NetworkKey;
}): Promise<{ success: boolean; txHash?: string; userOpHash?: string; error?: string }> {
    try {
        const { privateKey, recipient, amount, tokenAddress, networkKey } = params;
        const network = NETWORKS[networkKey];

        const key = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
        const signer = privateKeyToAccount(key);

        const smartAccountAddress = await deriveSmartAccountAddress(
            signer.address,
            network.factoryAddress,
            '0x',
            networkKey
        );

        const publicClient = createPublicClient({
            chain: network.chain,
            transport: http(network.chain.rpcUrls.default.http[0]),
        });

        const deployed = await isAccountDeployed(smartAccountAddress, networkKey);
        const initCode: `0x${string}` = deployed
            ? '0x'
            : getInitCode(network.factoryAddress, signer.address);

        const nonce = await publicClient.readContract({
            address: network.entryPoint,
            abi: ENTRY_POINT_ABI,
            functionName: 'getNonce',
            args: [smartAccountAddress, 0n],
        });

        const isNative = tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000';

        let executeCallData: `0x${string}`;
        if (isNative) {
            executeCallData = encodeFunctionData({
                abi: SMART_ACCOUNT_ABI,
                functionName: 'execute',
                args: [recipient, amount, '0x' as `0x${string}`],
            });
        } else {
            const transferCallData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [recipient, amount],
            });
            executeCallData = encodeFunctionData({
                abi: SMART_ACCOUNT_ABI,
                functionName: 'execute',
                args: [tokenAddress, 0n, transferCallData],
            });
        }

        let maxFeePerGas: bigint;
        let maxPriorityFeePerGas: bigint;
        try {
            const gasPrices = await bundlerRpc('pimlico_getUserOperationGasPrice', [], network.bundlerUrl);
            maxFeePerGas = BigInt(gasPrices.standard.maxFeePerGas);
            maxPriorityFeePerGas = BigInt(gasPrices.standard.maxPriorityFeePerGas);
        } catch {
            maxFeePerGas = 1500000000n;
            maxPriorityFeePerGas = 1500000000n;
        }

        const DUMMY_SIG = '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

        const userOp: UserOp = {
            sender: smartAccountAddress,
            nonce,
            initCode,
            callData: executeCallData,
            callGasLimit: 300000n,
            verificationGasLimit: deployed ? 300000n : 1000000n,
            preVerificationGas: 600000n,
            maxFeePerGas,
            maxPriorityFeePerGas,
            paymasterAndData: '0x' as `0x${string}`,
            signature: DUMMY_SIG as `0x${string}`,
        };

        try {
            const gasEstimate = await bundlerRpc('eth_estimateUserOperationGas', [
                formatUserOpForBundler(userOp),
                network.entryPoint,
            ], network.bundlerUrl);
            if (gasEstimate) {
                userOp.callGasLimit = BigInt(gasEstimate.callGasLimit || '0x493e0');
                userOp.verificationGasLimit = BigInt(gasEstimate.verificationGasLimit || '0x493e0');
                const estimatedPreVerificationGas = BigInt(gasEstimate.preVerificationGas || '0x927c0');
                userOp.preVerificationGas = estimatedPreVerificationGas > 600000n ? estimatedPreVerificationGas : 600000n;
            }
        } catch (e) {
            console.warn('Gas estimation failed, using defaults:', (e as Error).message);
        }

        try {
            const paymasterData = await getThirdwebPaymasterData(userOp, network.entryPoint, network.chain.id);
            userOp.paymasterAndData = paymasterData.paymasterAndData;
        } catch (e) {
            console.warn('Paymaster sponsorship unavailable:', (e as Error).message);
        }

        userOp.signature = '0x' as `0x${string}`;
        const userOpHash = getUserOpHash(userOp, network.entryPoint, network.chain.id);
        userOp.signature = await signer.signMessage({ message: { raw: userOpHash } });

        const formattedUserOp = formatUserOpForBundler(userOp);

        let userOpHashResult: string;
        try {
            userOpHashResult = await bundlerRpc('eth_sendUserOperation', [
                formattedUserOp,
                network.entryPoint,
            ], network.bundlerUrl);
        } catch (bundlerError) {
            const err = bundlerError as Error;
            const errorMessage = err.message || JSON.stringify(bundlerError);
            if (errorMessage.includes("didn't pay prefund") || errorMessage.includes('AA21')) {
                return { success: false, error: 'PREFUND_REQUIRED' };
            }
            throw bundlerError;
        }

        let receipt: { success?: boolean; receipt?: { transactionHash?: string } } | null = null;
        let attempts = 0;
        while (!receipt && attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                receipt = await bundlerRpc('eth_getUserOperationReceipt', [userOpHashResult], network.bundlerUrl);
            } catch {
                // pending
            }
            attempts++;
        }

        if (receipt && receipt.success) {
            return {
                success: true,
                txHash: receipt.receipt?.transactionHash,
                userOpHash: userOpHashResult,
            };
        }

        return {
            success: false,
            error: 'Transaction pending or failed',
            userOpHash: userOpHashResult,
        };
    } catch (error) {
        const err = error as Error;
        const errorMessage = err.message || JSON.stringify(error);
        if (errorMessage.includes("didn't pay prefund") || errorMessage.includes('AA21')) {
            return { success: false, error: 'PREFUND_REQUIRED' };
        }
        return { success: false, error: err.message || 'Failed to transfer' };
    }
}

// Deploy smart account using thirdweb wallet (follows same pattern as token transfers)
export async function deploySmartAccountWithWallet(
    wallet: Wallet,
    smartAccountAddress: Address,
    networkKey: NetworkKey = 'monad'
): Promise<{ success: boolean; txHash?: string; userOpHash?: string; error?: string }> {
    try {
        const network = NETWORKS[networkKey];

        // Check if already deployed
        const deployed = await isAccountDeployed(smartAccountAddress, networkKey);
        if (deployed) {
            return { success: false, error: 'Account is already deployed' };
        }

        // Get the owner/admin account from the wallet
        let ownerAccount = null;

        // Try getAdminAccount first (for smart accounts, this gets the owner)
        if (wallet.getAdminAccount) {
            try {
                ownerAccount = await wallet.getAdminAccount();
            } catch {
                // Fall through to getAccount
            }
        }

        // Fallback to getAccount (the connected wallet account)
        if (!ownerAccount) {
            ownerAccount = wallet.getAccount();
        }

        if (!ownerAccount || !ownerAccount.address) {
            return {
                success: false,
                error: 'No owner account found in wallet'
            };
        }

        const ownerAddress = ownerAccount.address as Address;

        // Create public client
        const publicClient = createPublicClient({
            chain: network.chain,
            transport: http(network.chain.rpcUrls.default.http[0]),
        });

        // Generate initCode using owner address
        const initCode = getInitCode(network.factoryAddress, ownerAddress);

        // Get nonce
        const nonce = await publicClient.readContract({
            address: network.entryPoint,
            abi: ENTRY_POINT_ABI,
            functionName: 'getNonce',
            args: [smartAccountAddress, 0n],
        });

        // Get gas prices from Pimlico
        let maxFeePerGas: bigint;
        let maxPriorityFeePerGas: bigint;

        try {
            const gasPrices = await bundlerRpc('pimlico_getUserOperationGasPrice', [], network.bundlerUrl);
            maxFeePerGas = BigInt(gasPrices.standard.maxFeePerGas);
            maxPriorityFeePerGas = BigInt(gasPrices.standard.maxPriorityFeePerGas);
        } catch {
            console.warn('Failed to get bundler gas prices, using fallback');
            maxFeePerGas = 1500000000n; // 1.5 gwei minimum
            maxPriorityFeePerGas = 1500000000n;
        }

        // Dummy signature for gas estimation
        const DUMMY_SIG = '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

        // Build UserOperation for deployment (empty callData - just deploy)
        const userOp: UserOp = {
            sender: smartAccountAddress,
            nonce: nonce,
            initCode: initCode,
            callData: '0x' as `0x${string}`, // Empty call - just deploy
            callGasLimit: 100000n,
            verificationGasLimit: 1000000n, // Higher for deployment
            preVerificationGas: 600000n, // Increased from 500000n
            maxFeePerGas: maxFeePerGas,
            maxPriorityFeePerGas: maxPriorityFeePerGas,
            paymasterAndData: '0x' as `0x${string}`,
            signature: DUMMY_SIG as `0x${string}`,
        };

        // Estimate gas
        try {
            const gasEstimate = await bundlerRpc('eth_estimateUserOperationGas', [
                formatUserOpForBundler(userOp),
                network.entryPoint,
            ], network.bundlerUrl);

            if (gasEstimate) {
                userOp.callGasLimit = BigInt(gasEstimate.callGasLimit || '0x186a0');
                userOp.verificationGasLimit = BigInt(gasEstimate.verificationGasLimit || '0xf4240');
                // Ensure preVerificationGas is at least 600000 or the estimated value, whichever is higher
                const estimatedPreVerificationGas = BigInt(gasEstimate.preVerificationGas || '0x927c0');
                userOp.preVerificationGas = estimatedPreVerificationGas > 600000n ? estimatedPreVerificationGas : 600000n;
            }
        } catch (e) {
            console.warn('Gas estimation failed, using defaults:', (e as Error).message);
        }

        // Get paymaster data from Thirdweb (for sponsored gas)
        try {
            const paymasterData = await getThirdwebPaymasterData(
                userOp,
                network.entryPoint,
                network.chain.id
            );
            userOp.paymasterAndData = paymasterData.paymasterAndData;
        } catch (e) {
            console.warn('Failed to get paymaster data, user will pay gas:', (e as Error).message);
        }

        // Sign UserOperation using Thirdweb wallet
        userOp.signature = '0x' as `0x${string}`;
        const userOpHash = getUserOpHash(userOp, network.entryPoint, network.chain.id);

        const signature = await signUserOpHashWithThirdwebWallet(
            wallet,
            userOpHash
        );
        userOp.signature = signature;

        // Submit to bundler
        const formattedUserOp = formatUserOpForBundler(userOp);
        let userOpHashResult: string;
        try {
            userOpHashResult = await bundlerRpc('eth_sendUserOperation', [
                formattedUserOp,
                network.entryPoint,
            ], network.bundlerUrl);
        } catch (bundlerError) {
            // Check for prefund error
            const errorMessage = (bundlerError as Error).message || JSON.stringify(bundlerError);
            if (errorMessage.includes('didn\'t pay prefund') || errorMessage.includes('AA21')) {
                return {
                    success: false,
                    error: 'Fund your smart account address'
                };
            }
            throw bundlerError; // Re-throw if not a prefund error
        }

        // Wait for receipt
        let receipt: { success?: boolean; receipt?: { transactionHash?: string } } | null = null;
        let attempts = 0;

        while (!receipt && attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                receipt = await bundlerRpc('eth_getUserOperationReceipt', [userOpHashResult], network.bundlerUrl);
            } catch {
                // Receipt not ready yet
            }
            attempts++;
        }

        if (receipt && receipt.success) {
            return {
                success: true,
                txHash: receipt.receipt?.transactionHash,
                userOpHash: userOpHashResult
            };
        } else {
            return {
                success: false,
                error: 'Deployment transaction pending or failed',
                userOpHash: userOpHashResult
            };
        }

    } catch (error) {
        console.error('Error deploying smart account with wallet:', error);

        // Check for prefund error
        const err = error as Error;
        const errorMessage = err.message || JSON.stringify(error);
        if (errorMessage.includes('didn\'t pay prefund') || errorMessage.includes('AA21')) {
            return {
                success: false,
                error: 'Fund your smart account address'
            };
        }

        return {
            success: false,
            error: err.message || 'Failed to deploy smart account'
        };
    }
}

