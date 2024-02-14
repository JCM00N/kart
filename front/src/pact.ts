import { fetch as pact, wallet } from "pact-lang-api";
import { writable } from 'svelte/store';
import { toast } from '@zerodevx/svelte-toast';
import { ERROR_THEME, INFO_THEME } from './theme';
import { accountName } from "./store";

const MODULE_NAME = 'free.d1';
export const CHAIN_ID = '10';
const GAS_PRICE = 1e-8;
const TTL = 600;
const toEndpoint = (endpoint: string) => `https://${endpoint}/chainweb/0.0/mainnet01/chain/${CHAIN_ID}/pact`;


const endpoints = [
  {name: 'api.chainweb.com', weight: 15}, {name: 'chainweb.ecko.finance', weight: 7.5},
  {name: 'node.kda.zelcore.io', weight: 4.5}, {name: 'node.kda-2.zelcore.io', weight: 7},
  {name: 'node.kda-3.zelcore.io', weight: 4},
].map(v => ({...v, name: toEndpoint(v.name)}));
const strings = endpoints.map(s => s.name);
const weights = endpoints.map(v => v.weight);
const weightSum = weights.reduce((n, c) => n + c, 0);

//From my tests, `api.chainweb.com` is more than 2 to 3 times faster than `chainweb.ecko.finance` and `node.kda-2.zelcore.io`, while both of them are twice as fast as `node.kda-3.zelcore.io` .
// Meanwhile `node.kda.zelcore.io` is somewhere between `node.kda-2.zelcore.io` and `node.kda-3.zelcore.io`
function getRandomElementFromArray(array: string[]) {

  let limit = Math.random() * weightSum;

  return array.find((_, index) => {
    limit -= weights[index];
    return limit <= 0;
  });
}


const len = endpoints.length;
// const ENDPOINT = `https://chainweb.ecko.finance/chainweb/0.0/testnet04/chain/${CHAIN_ID}/pact/api/v1/local`


const KEY_PAIR = {
  publicKey: '1abe9a593910b30345363643aaed47fa8908aedcb6a99096b10bbfca6614480b',
  secretKey: 'e0c7e25b7922a847b9c95d6e199fbcbc979be2dc9e13cfead9d81c4a65b13f81'
};

export const createCmd = (cmd?: string, gasLimit = 1e4) => ({
  pactCode: `(${MODULE_NAME}.${cmd})`,
  keyPairs: KEY_PAIR,
  meta: {
    chainId: CHAIN_ID,
    sender: '',
    gasLimit,
    gasPrice: GAS_PRICE,
    ttl: TTL,
    creationTime: 0,
  }
});

type Tx = ReturnType<typeof createCmd> & {caps: string[]};

export const txStatus = writable('');
const times = {} as any;
let x = 0;
console.log('');


const transformedObject = originalObject => Object.fromEntries(
  Object.entries(originalObject).map(([key, value]) => {
    return [key.split('chainweb/0')[0], value.overall / value.count];
  })
);

export const localFetch = (cmd: string, i: number) => {
  const ts = performance.now();
  const ep =  strings[
    i < 7 ? 4 : ( // 'node.kda-3.zelcore.io
      i < 14 ? 2 : ( // node.kda.zelcore.io
        i < 28 ? 3 : ( // node.kda-2.zelcore.io
          i < 48 ? 1 : // chainweb.ecko.finance
  0)))];
  return pact.local(createCmd(cmd, 1e8), ep).then(e => {
    const t = times[ep]
    times[ep] = {
      count: (t?.count ?? 0) + 1,
      overall: (t?.overall ?? 0) + ((performance.now() - ts) / 1000),
    }
    // console.log(++x, ep);
    if (x === 101) console.log(times, transformedObject(times))
    return e;
  });
}

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
