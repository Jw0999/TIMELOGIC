import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent ensures Expo runtime (native modules, PlatformConstants, etc.)
// is fully initialized before React renders anything. Required for SDK 51+ with React Navigation.
registerRootComponent(App);
