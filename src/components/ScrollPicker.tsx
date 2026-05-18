import { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ViewToken,
} from 'react-native';
import { Colors } from '../constants/theme';

const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5; // 上2つ + 選択中 + 下2つ

type Props = {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
};

export default function ScrollPicker({ values, selected, onSelect }: Props) {
  const listRef = useRef<FlatList<number>>(null);
  const isUserScrolling = useRef(false);

  // 選択値が外部から変わったときにスクロール位置を合わせる
  useEffect(() => {
    if (isUserScrolling.current) return;
    const index = values.indexOf(selected);
    if (index >= 0 && listRef.current) {
      listRef.current.scrollToIndex({ index, animated: false });
    }
  }, [selected, values]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<number>[] }) => {
      // 中央のアイテムを選択値とする
      const center = viewableItems.find((v) => v.index !== null);
      if (center?.item !== undefined && center.item !== selected) {
        onSelect(center.item);
      }
    },
    [onSelect, selected]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 50,
  }).current;

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  return (
    <View style={styles.container}>
      {/* 選択中のハイライト枠 */}
      <View style={styles.highlight} pointerEvents="none" />

      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onScrollBeginDrag={() => { isUserScrolling.current = true; }}
        onMomentumScrollEnd={() => { isUserScrolling.current = false; }}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <View style={styles.item}>
              <Text
                style={[
                  styles.itemText,
                  isSelected && styles.itemTextSelected,
                ]}
              >
                {String(item).padStart(2, '0')}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 100,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 4,
    zIndex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.textMuted,
  },
  itemTextSelected: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.textPrimary,
  },
});
