import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { parseTimeString, formatTimeForDisplay } from '../utils/time';

interface TimePickerProps {
  value: string; // HH:MM format
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  const { hours, minutes } = parseTimeString(value);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const newTime = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
      onChange(newTime);
    }
  };
  
  const handleConfirm = () => {
    setShowPicker(false);
  };
  
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.timeText}>{formatTimeForDisplay(value)}</Text>
        <Text style={styles.editIcon}>⏰</Text>
      </TouchableOpacity>
      
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.doneButton}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={handleChange}
                textColor={COLORS.white}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={false}
            onChange={handleChange}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray400,
    marginBottom: SPACING.xs,
  },
  
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray800,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray700,
  },
  
  timeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  editIcon: {
    fontSize: 20,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: COLORS.gray900,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 40,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray800,
  },
  
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  
  doneButton: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.accent,
  },
  
  picker: {
    height: 200,
  },
});
