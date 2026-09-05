import AsyncStorage from "@react-native-async-storage/async-storage";

export const setLocalStorage = async (key, value) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getLocalStorage = async (key) => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

export const RemoveLocalStorage = async (key) => {
  await AsyncStorage.removeItem(key);
};

// Firebase ka User object class instance hota hai, plain object nahi —
// JSON.stringify/spread se displayName jaisi fields silently drop ho sakti hain.
// Isliye storage mein daalne se pehle isse plain object mein convert karo.
export const toPlainUser = (user, overrides = {}) => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    ...overrides,
  };
};
