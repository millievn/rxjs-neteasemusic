export const isBrowser = () => process.browser;
export const __DEV__ = () => process.env.NODE_ENV === 'development';

export function localGetValue<T>(name: string, defaultVal?: T) {
  return isBrowser() ? localStorage.getItem(name) ?? defaultVal : defaultVal;
}
