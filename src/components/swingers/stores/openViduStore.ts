import { map } from 'nanostores';
import { IOpenViduPublisher, IOpenViduSubscriber, ISession } from '@/components/swingers/types';

interface OpenViduStoreState {
  currentSessionId: string | null;
  session: ISession | null; // OpenVidu Session object
  publisher: IOpenViduPublisher | null; // Local publisher
  subscribers: IOpenViduSubscriber[]; // Remote subscribers
  loading: boolean;
  error: string | null;
}

export const openViduStore = map<OpenViduStoreState>({
  currentSessionId: null,
  session: null,
  publisher: null,
  subscribers: [],
  loading: false,
  error: null,
});

export const resetOpenViduStore = () => {
  openViduStore.set({
    currentSessionId: null,
    session: null,
    publisher: null,
    subscribers: [],
    loading: false,
    error: null,
  });
};

export const setOpenViduSessionId = (sessionId: string | null) => {
  openViduStore.setKey('currentSessionId', sessionId);
};

export const setOpenViduSession = (session: ISession | null) => {
  openViduStore.setKey('session', session);
};

export const setOpenViduPublisher = (publisher: IOpenViduPublisher | null) => {
  openViduStore.setKey('publisher', publisher);
};

export const addOpenViduSubscriber = (subscriber: IOpenViduSubscriber) => {
  openViduStore.setKey('subscribers', [...openViduStore.get().subscribers, subscriber]);
};

export const removeOpenViduSubscriber = (streamId: string) => {
  openViduStore.setKey(
    'subscribers',
    openViduStore.get().subscribers.filter((s) => s.streamId !== streamId),
  );
};

export const setOpenViduLoading = (loading: boolean) => {
  openViduStore.setKey('loading', loading);
};

export const setOpenViduError = (error: string | null) => {
  openViduStore.setKey('error', error);
};
