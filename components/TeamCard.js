import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function TeamCard({ team, onPress, onUpdate, onDelete }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      android_ripple={{ color: '#e0e0e0' }}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{team.name}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {onUpdate && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation(); 
              onUpdate();
            }}
            style={styles.updateButton}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
          </Pressable>
        )}

        <Pressable
          onPress={(e) => {
            e.stopPropagation(); 
            setModalVisible(true);
          }}
          style={styles.deleteButton}
        >
          <MaterialIcons name="delete" size={20} color="#fff" />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Möchten Sie dieses Team wirklich löschen?
            </Text>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setModalVisible(false);
                onDelete?.();
              }}
            >
              <Text style={styles.actionText}>Team löschen</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButton: {
    width: 40,
    height: 40,
    backgroundColor: '#6B8F71',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    width: 40,
    height: 40,
    backgroundColor: '#444',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: 'bold',
    color: '#333',
  },
});
