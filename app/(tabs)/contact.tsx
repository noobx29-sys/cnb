import { StyleSheet, Image, Platform, SafeAreaView, Linking, TouchableOpacity, ScrollView, RefreshControl, StatusBar, useColorScheme } from 'react-native';
import { useState, useCallback } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MapView, { Marker } from 'react-native-maps';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
export default function Contact() {
  const [refreshing, setRefreshing] = useState(false);
  const [mapError, setMapError] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    titleContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    introText: {
      marginBottom: 8,
      fontSize: 16,
      fontWeight: '500',
    },
    section: {
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
    },
    sectionContent: {
      marginBottom: 12,
      lineHeight: 22,
    },
    contactInfo: {
      marginBottom: 8,
      fontSize: 16,
    },
    subsectionTitle: {
      marginTop: 16,
      marginBottom: 8,
    },
    socialLinks: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
      marginBottom: 10,
    },
    footer: {
      textAlign: 'center',
      color: '#7f8c8d',
      fontSize: 12,
      marginTop: 4,
      marginBottom: 34,
    },
    linkContainer: {
      flexDirection: 'row',
      alignItems: 'center', // this is already there
      gap: 8,
      marginBottom: 2,
    },
    navigationLinks: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    navigationIcon: {
      width: 24,
      height: 24,
    },
  });
  

  const onRefresh = () => {
    setRefreshing(true);
    // Since there's no data to reload, we'll just simulate a refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber.replace(/\s/g, '')}`);
  };

  const handleMapError = useCallback((error: any) => {
    console.error('Map error:', error);
    setMapError(true);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FB8A13']} // Android
              tintColor="#FB8A13" // iOS
            />
          }
        >
          <ThemedView style={styles.content}>
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title">CNB CARPETS SDN BHD</ThemedText>
            </ThemedView>
            
            <TouchableOpacity onPress={() => handlePhoneCall('1300222622')}>
              <ThemedView style={[styles.linkContainer, { borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingBottom: 8 }]}>
                <Ionicons name="call" size={24} color="#FB8A13" />
                <ThemedText style={[styles.introText, { color: '#FB8A13' , fontSize: 20, fontWeight: 'bold', marginBottom: 10}]}>
                  1300 22 2622 (CNBC)
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>

            {/* Petaling Jaya Office */}
            <ThemedView style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Petaling Jaya Office
              </ThemedText>
              {!mapError ? (
                <MapView
                  style={{ width: '100%', height: 200, marginVertical: 10, borderRadius: 10 }}
                  initialRegion={{
                    latitude: 3.111126,
                    longitude: 101.611626,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onLayout={(e) => {
                    try {
                      // Map loaded successfully
                    } catch (error) {
                      handleMapError(error);
                    }
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: 3.111126,
                      longitude: 101.611626,
                    }}
                    title="CNB Carpets PJ Office"
                    description="No.18, Jalan SS2/3, 47300 Petaling Jaya"
                  />
                </MapView>
              ) : (
                <ThemedText style={styles.sectionContent}>
                  Map temporarily unavailable
                </ThemedText>
              )}
              <TouchableOpacity onPress={() => handlePhoneCall('60376663333')} style={{marginBottom: 10}}>
                <ThemedView style={styles.linkContainer}>
                  <Ionicons name="call" size={30} color="#FB8A13" />
                  <ThemedText style={styles.contactInfo}>
                    +603 7666 3333
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/60162087930')}>
                <ThemedView style={styles.linkContainer}>
                  <FontAwesome5 name="whatsapp" size={34} color="#25D366" />
                  <ThemedText style={styles.contactInfo}>
                    +60162087930 (Whatsapp only)
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={styles.subsectionTitle}>
                Business Hours:
              </ThemedText>
              <ThemedText style={styles.sectionContent}>
                Monday - Friday: 8:30 AM - 5:00 PM{'\n'}
                Saturday: 8:30 AM - 1:00 PM
              </ThemedText>
              <ThemedView style={styles.navigationLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://ul.waze.com/ul?ll=3.11112600%2C101.61162600&navigate=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="waze" size={30} color="#33ccff" />
                    <ThemedText type="link" style={{fontSize: 16, color: '#33ccff'}}>Waze</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=3.111126,101.611626')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="google" size={24} color="#DB4437" />
                    <ThemedText type="link" style={{fontSize: 16, color: '#DB4437'}}>Google Maps</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            {/* Puchong Office */}
            <ThemedView style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Puchong Office
              </ThemedText>
              {!mapError ? (
                <MapView
                  style={{ width: '100%', height: 200, marginVertical: 10, borderRadius: 10 }}
                  initialRegion={{
                    latitude: 3.06937,
                    longitude: 101.662009,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onLayout={(e) => {
                    try {
                      // Map loaded successfully
                    } catch (error) {
                      handleMapError(error);
                    }
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: 3.06937,
                      longitude: 101.662009,
                    }}
                    title="CNB Carpets Puchong Office"
                    description="No.59, Jalan 10/152, Taman Industrial O.U.G."
                  />
                </MapView>
              ) : (
                <ThemedText style={styles.sectionContent}>
                  Map temporarily unavailable
                </ThemedText>
              )}
              <TouchableOpacity onPress={() => handlePhoneCall('60377833377')} style={{marginBottom: 10}}>
                <ThemedView style={styles.linkContainer}>
                  <Ionicons name="call" size={30} color="#FB8A13" />
                  <ThemedText style={styles.contactInfo}>
                    +603 7783 3377
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/60176502622')}>
                <ThemedView style={styles.linkContainer}>
                  <FontAwesome5 name="whatsapp" size={34} color="#25D366" />
                  <ThemedText style={styles.contactInfo}>
                    +60176502622 (Whatsapp only)
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={styles.subsectionTitle}>
                Business Hours:
              </ThemedText>
              <ThemedText style={styles.sectionContent}>
                Monday - Friday: 8:30 AM - 5:00 PM{'\n'}
                Saturday: 8:30 AM - 1:00 PM
              </ThemedText>
              <ThemedView style={styles.navigationLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://ul.waze.com/ul?ll=3.06937000%2C101.66200900&navigate=yes&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="waze" size={30} color="#33ccff" />
                    <ThemedText type="link" style={{fontSize: 16, color: '#33ccff'}}>Waze</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=3.06937,101.662009')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="google" size={24} color="#DB4437" />
                    <ThemedText type="link" style={{fontSize: 16, color: '#DB4437'}}>Google Maps</ThemedText>
                  </ThemedView>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Follow Us
              </ThemedText>
              <ThemedView style={styles.socialLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/CNBCarpets/')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="facebook" size={40} color="#1877F2" />
                  </ThemedView>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/cnbcarpets/')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="instagram" size={40} color="#E4405F" />
                  </ThemedView>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://www.tiktok.com/@cnbcarpets')}>
                  <ThemedView style={styles.linkContainer}>
                    <FontAwesome5 name="tiktok" size={36} color="#000000" />
                  </ThemedView>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>

            <ThemedText style={styles.footer}>
              © 2024 CNB Carpets Sdn. Bhd. All Rights Reserved.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}