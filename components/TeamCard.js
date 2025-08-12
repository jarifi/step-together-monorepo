import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function TeamCard({ team, onUpdate, onDelete }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{team.name}</Text>
      <View style={styles.buttonContainer}>
        {onUpdate && (
          <Pressable onPress={onUpdate} style={styles.updateButton}>
            <Text style={styles.buttonText}>✎</Text>
          </Pressable>
        )}
      </View>
    </View>
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
    backgroundColor: 'green',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});