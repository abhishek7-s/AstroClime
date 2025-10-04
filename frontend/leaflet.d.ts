// This imports the original Leaflet module's types
import 'leaflet';

// This tells TypeScript we want to add something to the 'leaflet' module
declare module 'leaflet' {
  // We are augmenting the Icon.Default class
  namespace Icon {
    interface Default {
      // We declare that an optional property '_getIconUrl' might exist on its prototype
      prototype: {
        _getIconUrl?: string; // CORRECTED: Was "_getIcon-url"
      }
    }
  }
}