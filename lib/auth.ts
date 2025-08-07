import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem('userToken', token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('userToken');
};

export const saveUserId = async (id: string) => {
  await AsyncStorage.setItem('userId', id);
};

export const getUserId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('userId');
};


export const isLoggedIn = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};


export const removeToken = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userId');
};
