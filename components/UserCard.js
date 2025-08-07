import { Image, StyleSheet, Text, View } from 'react-native';

export default function UserCard({ user }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: user.avatar }}
        style={styles.avatar}
      />
      <View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
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
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  name: {
    fontWeight: 'bold',
  },
  email: {
    color: 'gray',
  },
});
