import { fetch as pact, wallet } from "pact-lang-api";
import { writable } from 'svelte/store';
import { toast } from '@zerodevx/svelte-toast';
import { ERROR_THEME, INFO_THEME } from './theme';
import { accountName } from "./store";

const MODULE_NAME = 'free.d4';
export const CHAIN_ID = '1';
const GAS_PRICE = 1e-8;
const TTL = 600;
const ENDPOINT = `https://api.testnet.chainweb.com/chainweb/0.0/testnet04/chain/${CHAIN_ID}/pact`;

const KEY_PAIR = {
  publicKey: '1abe9a593910b30345363643aaed47fa8908aedcb6a99096b10bbfca6614480b',
  secretKey: 'e0c7e25b7922a847b9c95d6e199fbcbc979be2dc9e13cfead9d81c4a65b13f81'
};

export const createCmd = (cmd?: string) => ({
  pactCode: `(${MODULE_NAME}.${cmd})`,
  keyPairs: KEY_PAIR,
  meta: {
    chainId: CHAIN_ID,
    sender: '',
    gasLimit: 1e5,
    gasPrice: GAS_PRICE,
    ttl: TTL,
    creationTime: 0,
  }
});

type Tx = ReturnType<typeof createCmd> & {caps: string[]};

export const txStatus = writable('');

export const localFetch = (cmd: string) => pact.local(createCmd(cmd), ENDPOINT);

const WALLET_ERR = `
<strong class="strong-text"><span class="emoji">⚠️</span> No wallet detected!</strong><br>
Please make sure your wallet is opened and active
`;
const NOT_SIGNED = `
<strong class="strong-text"><span class="emoji">ℹ️</span> Transaction not signed</strong><br>`;
let isErrorOn = false;

async function sendSigned(signedTx: any) {
  toast.push('Transaction Sent', { theme: INFO_THEME, duration: 8e3 });
  
  txStatus.set('sending');
  return wallet.sendSigned(signedTx, ENDPOINT)
    .then((response: string | { requestKeys: [key: string] }) => {
      if (typeof response === 'string') {
          toast.push(response.includes('Keyset failure')
            ? 'Keyset failure. Please make sure the keyset matches the signing account'
            : 'An error occurred. Please try again later'
            , {theme: ERROR_THEME, duration: 1e4}
          );
        throw {message: response};
      }
      else return pact.listen({ listen: response.requestKeys[0] }, ENDPOINT);
    })
    .catch((err: Error) => {
      console.error(err);
    });
}

export async function signAndSend(tx: Tx) {
  txStatus.set('signing');
  
  return wallet.sign(tx).then(res => {
    if (res) {
      accountName.set(JSON.parse(res.cmd).meta.sender);
      return sendSigned(res);
    }
    
    toast.push(NOT_SIGNED, {
      target: 'bottom',
      theme: INFO_THEME,
      duration: 8e3,
    });
  }).catch((err: Error) => {
    if (err.message.includes('Failed to fetch') && !isErrorOn) {
      isErrorOn = true;
      toast.push(WALLET_ERR, {
        target: 'bottom',
        theme: ERROR_THEME,
        onpop: () => isErrorOn = false,
      });
    } else if (!isErrorOn)
      console.error(err);
  }).finally(() => txStatus.set(''));
}
