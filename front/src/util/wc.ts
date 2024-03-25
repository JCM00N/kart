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

const client = await SignClient.init({...init, metadata: {
  description: 'Draw on the Kadena blockchain!',
  url: import.meta.env.VITE_URL,
  name: import.meta.env.VITE_NAME,
  icons: [`${import.meta.env.VITE_URL}/favicon.ico`],
}});
let connection: Unpromise<ReturnType<typeof client.connect>>;
const modal = new WalletConnectModal({...init, enableExplorer: false});

const getName = (session: SessionTypes.Struct) => {
  const name = session?.namespaces?.kadena?.accounts?.[0]?.split?.(':')?.at?.(-1);
  return name ? `k:${name}` : '';
}

const getSession = () => {
  const {keys} = client.session;
  const session = client.session.length && client.session.get(keys[keys.length - 1]);
  if (session) {
    wallet.set('wc')
    accountName.set(getName(session));
  };

  return session;
}

let session = getSession();

const connect = async (isNew = false) => {
  if (isNew || !connection) {
    txStatus.set('connecting_wc');
    connection = await client.connect({
      pairingTopic: isNew ? undefined : client.pairing.getAll({ active: true })[0]?.topic,
      requiredNamespaces: {
        kadena: {
          methods: ['kadena_sign_v1'],
          chains: ['kadena:mainnet01'],
          events: []
        }
      }
    });
  }
  
  const { approval, uri } = connection;
  
  if (session) return accountName.set(getName(session));
  if (uri) modal.openModal({uri});
  txStatus.set('connecting');
  session = await abortable(approval()).finally(() => modal.closeModal());
  return {account: getName(session)};
};

const disconnect = () => client.disconnect({
  topic: session.topic, reason: getSdkError('USER_DISCONNECTED')
}).finally(() => {
  accountName.set('');
  session = undefined;
});

const request = tx => client.request({chainId: `kadena:${NETWORK_ID}`, topic: session.topic, request: {
  method: 'kadena_sign_v1',
  params: tx.data.signingCmd,
}});

export default { disconnect, connect, request };