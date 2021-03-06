/* @flow */
import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';
import { connect } from 'react-redux';

import { Screen } from '../common';
import SizeItem from './SizeItem';

const calculateKeyStorageSizes = obj =>
  Object.keys(obj)
    .map(key => ({
      key,
      size: JSON.stringify(obj[key]).length * 2,
    }))
    .sort((a, b) => b.size - a.size);

class StorageScreen extends PureComponent {
  render() {
    const { state } = this.props;
    const storageSizes = calculateKeyStorageSizes(state);

    return (
      <Screen title="Storage">
        <FlatList
          data={storageSizes}
          keyExtractor={item => item.key}
          renderItem={({ item }) => <SizeItem text={item.key} size={item.size} />}
        />
      </Screen>
    );
  }
}

export default connect(state => ({
  state,
}))(StorageScreen);
