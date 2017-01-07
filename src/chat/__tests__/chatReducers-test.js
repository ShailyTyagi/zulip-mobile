import chatReducers from '../chatReducers';
import {
  homeNarrow,
  privateNarrow,
  groupNarrow,
  streamNarrow,
  topicNarrow,
  specialNarrow,
} from '../../utils/narrow';
import {
  SWITCH_NARROW,
  MESSAGE_FETCH_SUCCESS,
  EVENT_NEW_MESSAGE,
  EVENT_UPDATE_MESSAGE,
} from '../../constants';

describe('chatReducers', () => {
  const homeNarrowStr = JSON.stringify(homeNarrow());
  const privateNarrowStr = JSON.stringify(privateNarrow('mark@example.com'));
  const groupNarrowStr = JSON.stringify(groupNarrow(['mark@example.com', 'john@example.com']));
  const streamNarrowStr = JSON.stringify(streamNarrow('some stream'));
  const topicNarrowStr = JSON.stringify(topicNarrow('some stream', 'some topic'));
  const allPrivateMessagesNarrowStr = JSON.stringify(specialNarrow('private'));

  test('handles unknown action and no previous state by returning initial state', () => {
    const newState = chatReducers(undefined, {});
    expect(newState).toBeDefined();
  });

  describe('SWITCH_NARROW', () => {
    test('changes current narrow', () => {
      const initialState = {
        narrow: [],
        caughtUp: [false, false],
        fetching: [false, false],
      };
      const action = {
        type: SWITCH_NARROW,
        narrow: streamNarrow('some stream'),
        fetching: [true, true],
      };
      const expectedState = {
        narrow: streamNarrow('some stream'),
        caughtUp: [false, false],
        fetching: [true, true],
      };

      const newState = chatReducers(initialState, action);

      expect(newState).toEqual(expectedState);
      expect(newState).not.toBe(initialState);
    });
  });

  describe('EVENT_NEW_MESSAGE', () => {
    test('appends message to state producing a copy of messages', () => {
      const initialState = {
        messages: {
          [homeNarrowStr]: [{ id: 1 }, { id: 2 }],
        },
        fetching: [false, false],
        caughtUp: [false, false],
      };
      const action = {
        type: EVENT_NEW_MESSAGE,
        message: { id: 3 },
      };
      const expectedState = {
        messages: {
          [homeNarrowStr]: [{ id: 1 }, { id: 2 }, { id: 3 }],
        },
        fetching: [false, false],
        caughtUp: [false, false],
      };

      const newState = chatReducers(initialState, action);

      expect(newState).toEqual(expectedState);
      expect(newState).not.toBe(initialState);
    });
  });

  test('Message sent to self is stored correctly', () => {
    const narrowWithSelfStr = JSON.stringify(privateNarrow('me@example.com'));
    const initialState = {
      messages: {
        [homeNarrowStr]: [],
        [narrowWithSelfStr]: [],
      }
    };
    const message = {
      id: 1,
      display_recipient: [{ email: 'me@example.com' }]
    };
    const action = {
      type: EVENT_NEW_MESSAGE,
      selfEmail: 'me@example.com',
      message,
    };
    const expectedState = {
      messages: {
        [homeNarrowStr]: [message],
        [narrowWithSelfStr]: [message],
      }
    };

    const newState = chatReducers(initialState, action);

    expect(newState).toEqual(expectedState);
    expect(newState).not.toBe(initialState);
  });

  test('appends stream message to all cached narrows that match', () => {
    const initialState = {
      messages: {
        [homeNarrowStr]: [{ id: 1 }, { id: 2 }],
        [allPrivateMessagesNarrowStr]: [{ id: 1 }, { id: 2 }],
        [streamNarrowStr]: [{ id: 2 }, { id: 3 }],
        [topicNarrowStr]: [{ id: 2 }, { id: 3 }],
        [privateNarrowStr]: [{ id: 2 }, { id: 4 }],
        [groupNarrowStr]: [{ id: 2 }, { id: 4 }],
      }
    };
    const message = {
      id: 3,
      type: 'stream',
      display_recipient: 'some stream',
      subject: 'some topic',
    };
    const action = {
      type: EVENT_NEW_MESSAGE,
      message,
    };
    const expectedState = {
      messages: {
        [homeNarrowStr]: [{ id: 1 }, { id: 2 }, message],
        [allPrivateMessagesNarrowStr]: [{ id: 1 }, { id: 2 }],
        [streamNarrowStr]: [{ id: 2 }, { id: 3 }, message],
        [topicNarrowStr]: [{ id: 2 }, { id: 3 }, message],
        [privateNarrowStr]: [{ id: 2 }, { id: 4 }],
        [groupNarrowStr]: [{ id: 2 }, { id: 4 }],
      },
    };

    const newState = chatReducers(initialState, action);

    expect(newState.messages).toEqual(expectedState.messages);
    expect(newState).not.toBe(initialState);
  });

  test('does not append stream message to not cached narrows', () => {
    const initialState = {
      messages: {
        [homeNarrowStr]: [{ id: 1 }],
      }
    };
    const message = {
      id: 3,
      type: 'stream',
      display_recipient: 'stream name',
      subject: 'some topic',
    };
    const action = {
      type: EVENT_NEW_MESSAGE,
      message,
    };
    const expectedState = {
      messages: {
        [homeNarrowStr]: [{ id: 1 }, message],
      },
    };

    const newState = chatReducers(initialState, action);

    expect(newState.messages).toEqual(expectedState.messages);
    expect(newState).not.toBe(initialState);
  });

  test('appends private message to multiple cached narrows', () => {
    const initialState = {
      messages: {
        [homeNarrowStr]: [{ id: 1 }, { id: 2 }],
        [allPrivateMessagesNarrowStr]: [{ id: 1 }, { id: 2 }],
        [streamNarrowStr]: [{ id: 2 }, { id: 3 }],
        [topicNarrowStr]: [{ id: 2 }, { id: 3 }],
        [privateNarrowStr]: [{ id: 2 }, { id: 4 }],
        [groupNarrowStr]: [{ id: 2 }, { id: 4 }],
      }
    };
    const message = {
      id: 5,
      type: 'private',
      sender_email: 'someone@example.com',
      display_recipient: [
        { email: 'me@example.com' },
        { email: 'mark@example.com' },
      ],
    };
    const action = {
      type: EVENT_NEW_MESSAGE,
      message,
      selfEmail: 'me@example.com',
    };
    const expectedState = {
      messages: {
        [homeNarrowStr]: [{ id: 1 }, { id: 2 }, message],
        [allPrivateMessagesNarrowStr]: [{ id: 1 }, { id: 2 }, message],
        [streamNarrowStr]: [{ id: 2 }, { id: 3 }],
        [topicNarrowStr]: [{ id: 2 }, { id: 3 }],
        [privateNarrowStr]: [{ id: 2 }, { id: 4 }, message],
        [groupNarrowStr]: [{ id: 2 }, { id: 4 }],
      },
    };

    const newState = chatReducers(initialState, action);

    expect(newState.messages).toEqual(expectedState.messages);
    expect(newState).not.toBe(initialState);
  });

  describe('EVENT_UPDATE_MESSAGE', () => {
    test('if a message does not exist no changes are made', () => {
      const initialState = {
        messages: {
          [homeNarrowStr]: [{ id: 1 }, { id: 2 }],
          [privateNarrowStr]: [],
        }
      };
      const action = {
        type: EVENT_UPDATE_MESSAGE,
        messageId: 3,
      };

      const newState = chatReducers(initialState, action);

      expect(newState.messages).toEqual(initialState.messages);
    });

    test('when a message exists in state, new state and new object is created with updated message in every key', () => {
      const initialState = {
        messages: {
          [homeNarrowStr]: [
            { id: 1 },
            { id: 2 },
            { id: 3, content: 'Old content' },
          ],
          [privateNarrowStr]: [
            { id: 3, content: 'Old content' },
          ]
        },
      };
      const action = {
        type: EVENT_UPDATE_MESSAGE,
        messageId: 3,
        newContent: 'New content',
        editTimestamp: 123,
      };
      const expectedState = {
        messages: {
          [homeNarrowStr]: [
            { id: 1 },
            { id: 2 },
            { id: 3, content: 'New content', edit_timestamp: 123 },
          ],
          [privateNarrowStr]: [
            { id: 3, content: 'New content', edit_timestamp: 123 },
          ]
        }
      };

      const newState = chatReducers(initialState, action);

      expect(newState).not.toBe(initialState);
      expect(newState.messages).toEqual(expectedState.messages);
    });
  });

  describe('MESSAGE_FETCH_SUCCESS', () => {
    test('when new messages with already existing messages come, they are merged and not duplicated', () => {
      const initialState = {
        messages: {
          [homeNarrowStr]: [
            { id: 1 },
            { id: 2 },
            { id: 3 },
          ],
        },
        fetching: [false, false],
        caughtUp: [false, false],
      };
      const action = {
        type: MESSAGE_FETCH_SUCCESS,
        narrow: [],
        messages: [
          { id: 2 },
          { id: 3 },
          { id: 4 },
        ],
        fetching: [false, false],
        caughtUp: [false, false],
      };
      const expectedState = {
        messages: {
          [homeNarrowStr]: [
            { id: 4 },
            { id: 1 },
            { id: 2 },
            { id: 3 },
          ],
        },
        fetching: [false, false],
        caughtUp: [false, false],
      };

      const newState = chatReducers(initialState, action);

      expect(newState.messages).toEqual(expectedState.messages);
      expect(newState).not.toBe(initialState);
    });

    test('added messages are sorted by timestamp', () => {
      const initialState = {
        messages: {
          [homeNarrowStr]: [
            { id: 1, timestamp: 3 },
            { id: 2, timestamp: 4 },
          ],
        },
        fetching: [false, false],
        caughtUp: [false, false],
      };
      const action = {
        type: MESSAGE_FETCH_SUCCESS,
        narrow: [],
        messages: [
          { id: 3, timestamp: 2 },
          { id: 4, timestamp: 1 },
        ],
        fetching: [false, false],
        caughtUp: [false, false],
      };
      const expectedState = {
        messages: {
          [homeNarrowStr]: [
            { id: 4, timestamp: 1 },
            { id: 3, timestamp: 2 },
            { id: 1, timestamp: 3 },
            { id: 2, timestamp: 4 },
          ],
        },
        fetching: [false, false],
        caughtUp: [false, false],
      };

      const newState = chatReducers(initialState, action);

      expect(newState.messages).toEqual(expectedState.messages);
      expect(newState).not.toBe(initialState);
    });
  });
});