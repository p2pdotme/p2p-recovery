import { isZkSyncChain } from 'thirdweb/utils';
import type { Account, Wallet } from 'thirdweb/wallets';
import { NETWORKS, THIRDWEB_CHAINS, type NetworkKey } from './network';

// Account to send a plain transaction from on the given network.
//
// The connected wallet is a thirdweb smart wallet: its account turns every transaction into a
// UserOp for Thirdweb's bundler, which rejects chains it does not serve ("Invalid chain").
// On networks without a bundler, the wallet's admin signer sends the transaction itself and
// pays the gas. zkSync chains are the exception: there the smart wallet account already
// sends ordinary transactions.
export async function getDirectSenderAccount(wallet: Wallet, networkKey: NetworkKey): Promise<Account> {
    const account = wallet.getAccount();
    if (!account) {
        throw new Error('Wallet not connected');
    }
    if (NETWORKS[networkKey].bundlerUrl !== null || !wallet.getAdminAccount) {
        return account;
    }
    if (await isZkSyncChain(THIRDWEB_CHAINS[networkKey])) {
        return account;
    }
    return wallet.getAdminAccount() ?? account;
}
