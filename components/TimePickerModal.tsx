import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatTimeDisplay, generateTimeOptions } from '@/lib/time';
import { colors, fonts } from '@/theme';

type TimePickerModalProps = {
  visible: boolean;
  selectedTime: string;
  onSelect: (time: string) => void;
  onClose: () => void;
};

const TIME_OPTIONS = generateTimeOptions();

export default function TimePickerModal({
  visible,
  selectedTime,
  onSelect,
  onClose,
}: TimePickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Notification time</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((time) => (
              <Pressable
                key={time}
                style={[styles.option, selectedTime === time && styles.optionSelected]}
                onPress={() => {
                  onSelect(time);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedTime === time && styles.optionTextSelected,
                  ]}
                >
                  {formatTimeDisplay(time)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    maxHeight: 280,
  },
  option: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent,
  },
  optionText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
  },
  optionTextSelected: {
    color: colors.accent,
  },
});