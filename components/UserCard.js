import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function UserCard({ user, onUpdate }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />

      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {onUpdate && (
        <Pressable onPress={onUpdate} style={styles.updateButton}>
          <Text style={styles.updateText}>✎</Text>
        </Pressable>
      )}
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontWeight: 'bold',
  },
  email: {
    color: 'gray',
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
  updateText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});