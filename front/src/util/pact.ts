import { fetch as pact, wallet as cw } from "pact-lang-api";
import { writable } from 'svelte/store';
import { toast } from '@zerodevx/svelte-toast';
import { ERROR_THEME, INFO_THEME } from './theme';
import { accountName, balance, wallet } from "./store";
import { CHAIN_ID, GAS_PRICE } from "./consts";

const networkId = 'mainnet01';
const MODULE_NAME = 'free.kart';
let walletName = '';
let provider: typeof window.kadena;
wallet.subscribe(val => {
  walletName = val;
  provider = val === 'koala' ? window.koala : window.kadena;
});

const GAS_ERROR = `Insufficient funds. Please make sure you have enough KDA to cover the gas fee on chain ${CHAIN_ID}`;
const TTL = 600;
const ENDPOINT = `https://api.chainweb.com/chainweb/0.0/${networkId}/chain/${CHAIN_ID}/pact`;

const KEY_PAIR = {
  publicKey: '1abe9a593910b30345363643aaed47fa8908aedcb6a99096b10bbfca6614480b',
  secretKey: 'e0c7e25b7922a847b9c95d6e199fbcbc979be2dc9e13cfead9d81c4a65b13f81'
};

export const createCmd = (cmd?: string, gasLimit = 1e4, sender = '', module = MODULE_NAME) => ({
  pactCode: `(${module}.${cmd})`,
  keyPairs: KEY_PAIR,
  meta: {
    chainId: CHAIN_ID,
    sender,
    gasLimit,
    gasPrice: GAS_PRICE,
    ttl: TTL,
    creationTime: Date.now(),
  }
});

type Tx = ReturnType<typeof createCmd> & {caps: string[]};

export const txStatus = writable('');

export const localFetch = (cmd: string, module = MODULE_NAME) => pact.local(createCmd(cmd, 1e8, '', module), ENDPOINT);

const WALLET_ERR = `
<strong class="strong-text"><span class="emoji">⚠️</span> No wallet detected!</strong><br>
Please make sure your wallet is opened and active
`;
const NOT_SIGNED = `
<strong class="strong-text"><span class="emoji">ℹ️</span> Transaction not signed</strong><br>`;
let isErrorOn = false;

const notSigned = () => toast.push(NOT_SIGNED, {
  target: 'bottom',
  theme: INFO_THEME,
  duration: 8e3,
});

const walletError = () => toast.push(WALLET_ERR, {
  target: 'bottom',
  theme: ERROR_THEME,
  onpop: () => isErrorOn = false,
});

const sendToEndpoint = tx => fetch(`${ENDPOINT}/api/v1/send`, {
  headers: {'Content-Type': 'application/json'},
  method: 'POST',
  body: JSON.stringify({cmds: [tx]})
}).then(res => res.text()).then((text) => {
  try {return JSON.parse(text)}
  catch (e) {return text}
});

async function sendSigned(signedTx: any) {
  toast.push('Transaction Sent', { theme: INFO_THEME, duration: 8e3 });
  
  txStatus.set('sending');
  return sendToEndpoint(signedTx)
    .then((response: string | { requestKeys: [key: string] }) => {
      if (typeof response === 'string') {
          toast.push(response.includes('Keyset failure')
            ? 'Keyset failure. Please make sure the keyset matches the signing account' 
            : response.includes('buy gas failed') 
              ? GAS_ERROR : 'An error occurred. Please try again later'
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

export async function logout() {
  txStatus.set('');
  return await provider.request({
    method: "kda_disconnect",
    networkId,
  }).finally(() => accountName.set(''));
}

const sendWithExtention = (tx: Tx) => provider.request({
  method: "kda_requestSign",
  networkId,
  data: {
      networkId,
      signingCmd: {...tx.meta, ...tx}
  }
}).then(result => {
  if (result.signedCmd)
    return sendSigned(result.signedCmd);
  else toast.push(result.message, {theme: INFO_THEME});
}).finally(() => txStatus.set(''));

export async function connect() {
  if (provider) {
    const result = await provider.request({method: 'kda_connect', networkId}).catch(walletError);
    toast.push(result.message, {theme: INFO_THEME});
    if (result.account)
      accountName.set(result.account.account);
  } else walletError();
};

const sendWithCW = (tx: Tx) => cw.sign(tx).then(res => {
  if (res) {
    accountName.set(JSON.parse(res.cmd).meta.sender);
    return sendSigned(res);
  }
  notSigned();
}).catch((err: Error) => {
  if (err.message.includes('Failed to fetch') && !isErrorOn) {
    isErrorOn = true;
    walletError();
  } else if (!isErrorOn)
    console.error(err);
}).finally(() => txStatus.set(''));

export async function signAndSend(tx: Tx) {
  txStatus.set('signing');
  if (walletName === 'cw')
    return sendWithCW(tx);
  else if (walletName === 'kadena' || walletName === 'koala')
    return sendWithExtention(tx);
}

accountName.subscribe(val => val && localFetch(`details "${val}"`, 'coin')
  .then(({result}) => {debugger;balance.set(result.data.balance)}));