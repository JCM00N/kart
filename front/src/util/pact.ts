import { fetch as pact, wallet as cw } from "pact-lang-api";
import { get, writable } from 'svelte/store';
import { toast } from '@zerodevx/svelte-toast';
import { ERROR_THEME, INFO_THEME } from './theme';
import { accountName, balance, cooldownDate, wallet } from "./store";
import {
  CHAIN_ID, ENDPOINT, GAS_ERROR, GAS_PRICE, KEY_PAIR, MODULE_NAME, NETWORK_ID, NOT_SIGNED, TTL, WALLET_ERR
} from "./consts";
import { abortable } from "./utility";

let wc: typeof import('./wc').default;
import('./wc').then(res => {
  wc = res.default;
  if (!provider) provider = wc;
});

const networkId = NETWORK_ID;

let provider: typeof window.kadena;
wallet.subscribe(val =>
  provider = val === 'koala' ? window.koala : val === 'wc' ? wc : window.kadena
);

const popMessage = (result: {message: string}) => toast.push(result.message, {theme: INFO_THEME});

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

export type Tx = ReturnType<typeof createCmd> & {caps: string[]};
export const txStatus = writable('');

const toEndpoint = (endpoint: string) => `https://${endpoint}/chainweb/0.0/mainnet01/chain/${CHAIN_ID}/pact`;

const endpoints = [
  'api.chainweb.com', 'chainweb.ecko.finance', 'node.kda.zelcore.io',
  'node.kda-2.zelcore.io', 'node.kda-3.zelcore.io',
].map(toEndpoint);

//From my tests, `api.chainweb.com` is more than 2 to 3 times faster than `chainweb.ecko.finance` and `node.kda-2.zelcore.io`, while both of them are twice as fast as `node.kda-3.zelcore.io` .
// Meanwhile `node.kda.zelcore.io` is somewhere between `node.kda-2.zelcore.io` and `node.kda-3.zelcore.io`
export const localFetch = (cmd: string, module = MODULE_NAME, fetchNumber = 50) => pact.local(
  createCmd(cmd, 1e8, '', module),
  endpoints[
    fetchNumber < 7 ? 4 : ( // 'node.kda-3.zelcore.io
      fetchNumber < 14 ? 2 : ( // node.kda.zelcore.io
        fetchNumber < 28 ? 3 : ( // node.kda-2.zelcore.io
          fetchNumber < 48 ? 1 : // chainweb.ecko.finance
  0)))] // api.chainweb.com
) as Promise<{result: {data: any}}>;

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
              ? GAS_ERROR
              : response.split(': ')[1] ?? 'An error occurred. Please try again later'
            , {theme: ERROR_THEME, duration: 1e4}
          );
        throw {message: response};
      }
      else return pact.listen({ listen: response.requestKeys[0] }, ENDPOINT)
        .finally(() => txStatus.set(''));
    })
    .catch((err: Error) => {
      console.error(err);
    });
}

export async function logout() {
  txStatus.set('disconnecting');
  return (get(wallet) === 'wc' ? wc.disconnect() : provider.request({
    method: "kda_disconnect",
    networkId,
  })).finally(() => {
    [txStatus, accountName].forEach(store => store.set(''));
    cooldownDate.set('0');
  });
}

// pact-lang-api doesn't parse result correctly despite my PRs, so I have to do it manually
const sendRegular = (tx: Tx) => abortable(provider.request({
  method: "kda_requestSign",
  networkId,
  data: {
    networkId,
    signingCmd: {...tx.meta, ...tx}
  }
})).then(result => {
  const body = result.body ?? result.signedCmd;
  if (body)
    return sendSigned(body);
  else toast.push(result.message, {theme: INFO_THEME});
}).catch(popMessage).finally(() => txStatus.set(''));

export async function connect(isNew: boolean | MouseEvent = false) {
  if (provider) {
    txStatus.set('connecting');
    try {
      const result = await abortable(get(wallet) === 'wc'
        ? wc.connect(isNew === true)
        : provider.request({ method: 'kda_connect', networkId }).catch(walletError)
      );
      if (result.account)
        accountName.set(result.account?.account ?? result.account);
      else popMessage(result);
    }
    catch (e) {popMessage(e);}
    finally {txStatus.set('');}
  } else walletError();
};

const sendWithCW = async (tx: Tx & {sender: string}) => {
  try {
    delete tx.meta.sender;
    const sender = get(accountName);
    const res = await abortable(cw.sign({...tx, ...tx.meta, ...sender && {sender}})) as any;
    if (res) {
      accountName.set(JSON.parse(res.cmd).meta.sender);
      wallet.set('cw');
      return sendSigned(res);
    }
    notSigned();
    txStatus.set('');
  } catch(err) {
    if (err.message.includes('Failed to fetch') && !isErrorOn) {
      isErrorOn = true;
      walletError();
    } else popMessage(err);
    txStatus.set('');
  }
}

export async function signAndSend(tx: Tx) {
  txStatus.set('signing');
  return (get(wallet) === 'cw' ? sendWithCW : sendRegular)(tx);
}

accountName.subscribe(name => name && localFetch(`details "${name}"`, 'coin')
  .then(({result}) => balance.set(result.data?.balance ?? 0)));