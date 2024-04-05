import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { getSdkError } from '@walletconnect/utils';
import type { SessionTypes } from '@walletconnect/types';
import type { Unpromise } from '../types';
import { accountName, wallet } from './store';
import { NETWORK_ID } from './consts';
import { abortable, aborter } from './utility';
import { txStatus } from './pact';

const init = {
  projectId: import.meta.env.VITE_PROJECT_ID,
  relayUrl: import.meta.env.VITE_RELAY_URL,
};

const clientPromise = SignClient.init({...init, metadata: {
  description: 'Draw on the Kadena blockchain!',
  url: import.meta.env.VITE_URL,
  name: import.meta.env.VITE_NAME,
  icons: [`${import.meta.env.VITE_URL}/favicon.ico`],
}});

let connection: Unpromise<ReturnType<(Unpromise<typeof clientPromise>)['connect']>>;
const modal = new WalletConnectModal({...init, enableExplorer: false});

const getName = async (sessionPromise: Promise<SessionTypes.Struct> | SessionTypes.Struct) => {
  const session = sessionPromise instanceof Promise ? await sessionPromise : sessionPromise;
  const name = session?.namespaces?.kadena?.accounts?.[0]?.split?.(':')?.at?.(-1);
  return name ? `k:${name}` : '';
}

const getSession = async () => {
  const client = await clientPromise;
  const {keys} = client.session;
  const session = client.session.length && client.session.get(keys[keys.length - 1]);
  if (session) {
    wallet.set('wc');
    accountName.set(await getName(session));
  };

  return session;
}

let session = getSession();

const connect = async (isNew = false) => {
  const client = await clientPromise;
  if (isNew || !connection) {
    const pairingTopic = isNew ? undefined : client.pairing.getAll({ active: true })[0]?.topic;
    txStatus.set(`connecting_wc_${pairingTopic ? 'existing' : 'new'}`);
    connection = await client.connect({pairingTopic, requiredNamespaces: {
      kadena: {
        methods: ['kadena_sign_v1'],
        chains: ['kadena:mainnet01'],
        events: []
      }
    }});
  }
  
  const { approval, uri } = connection;
  
  if (session) return accountName.set(await getName(session));
  if (uri) modal.openModal({ uri });
  txStatus.set('connecting');
  session = abortable(approval()).finally(() => modal.closeModal());
  return {account: await getName(session)};
};

const disconnect = async () => (await clientPromise).disconnect({
  topic: (await session).topic, reason: getSdkError('USER_DISCONNECTED')
}).finally(() => {
  accountName.set('');
  session = undefined;
});

const request = async tx => (await clientPromise).request({
  chainId: `kadena:${NETWORK_ID}`,
  topic: (await session).topic,
  request: {
    method: 'kadena_sign_v1',
    params: tx.data.signingCmd,
  }
});

export default { disconnect, connect, request };