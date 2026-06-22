// components/LeafletOSMMap.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  start: string;
  end: string;
};

export const LeafletOSMMap: React.FC<Props> = ({ start, end }) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Geocode start location
    fetch('https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      start
    )}&format=json&limit=1', { headers: { 'User-Agent': 'MyApp/1.0' } })
      .then(r => r.json())
      .then(([s]) => {
        if(!s) return;
        const startLatLng = [s.lat, s.lon];
        const startMarker = L.marker(startLatLng).addTo(map).bindPopup("${start}");

        // Geocode end location
        fetch('https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          end
        )}&format=json&limit=1', { headers: { 'User-Agent': 'MyApp/1.0' } })
          .then(r => r.json())
          .then(([e]) => {
            if(!e) return;
            const endLatLng = [e.lat, e.lon];
            const endMarker = L.marker(endLatLng).addTo(map).bindPopup("${end}");

            map.fitBounds([startLatLng, endLatLng]);

            const line = L.polyline([startLatLng, endLatLng], {color: 'blue'}).addTo(map);
          });
      });
  </script>
</body>
</html>
`;

  return (
    <View style={styles.container}>
      <WebView
      testID='map-webview'
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, borderRadius: 18 }}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 12,
  },
});
