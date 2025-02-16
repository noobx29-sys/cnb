declare module 'react-native-osmdroid' {
  import { ViewProps } from 'react-native';
  
  interface OSMMapViewProps extends ViewProps {
    initialRegion?: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    };
    showsUserLocation?: boolean;
    zoomEnabled?: boolean;
    scrollEnabled?: boolean;
  }

  class OSMMapView extends React.Component<OSMMapViewProps> {
    static Marker: any;
  }

  export default OSMMapView;
} 