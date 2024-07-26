import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { RouterCtrl } from '@walletconnect/modal-core'
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
let session: SessionTypes.Struct | undefined;
const modal = new WalletConnectModal(init);

const getName = (session: SessionTypes.Struct) => {
  const name = session?.namespaces?.kadena?.accounts?.[0]?.split?.(':')?.at?.(-1);
  return name ? `k:${name}` : '';
}

const invalidateSession = async () => {
  const client = await clientPromise;
  const {keys} = client.session;
  session = client.session.length && client.session.get(keys[keys.length - 1]);
  if (session) {
    wallet.set('wc');
    accountName.set(getName(session));
  };
};
invalidateSession();

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
  
  if (session) return accountName.set(getName(session));
  if (uri) {
    modal.openModal({ uri });
    RouterCtrl.reset('Qrcode');
  }
  txStatus.set('connecting');
  try {session = await abortable(approval()).finally(() => modal.closeModal());}
  catch (e) {
    invalidateSession();
    connection = undefined;
    throw e;
  }

  return {account: getName(session)};
};

const disconnect = async () => (await clientPromise).disconnect({
  topic: session.topic, reason: getSdkError('USER_DISCONNECTED')
}).finally(() => {
  accountName.set('');
  session = undefined;
});

const request = async tx => (await clientPromise).request({
  chainId: `kadena:${NETWORK_ID}`,
  topic: session.topic,
  request: {
    method: 'kadena_sign_v1',
    params: tx.data.signingCmd,
  }
});

export default { disconnect, connect, request };