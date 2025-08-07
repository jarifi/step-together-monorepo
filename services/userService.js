import Constants from 'expo-constants';

const { BASE_URL } = Constants.expoConfig.extra;

export const getUsers = async () => {
  try {
    const res = await fetch(`${BASE_URL}/users`);
    const users = await res.json();
    return users.map((u, i) => ({
      ...u,
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
    }));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};
