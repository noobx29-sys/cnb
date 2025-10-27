import 'dotenv/config';

export default {
  expo: {
    name: "NEWTEX",
    slug: "cnb",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/images/newtex-square.png",
    scheme: "cnb",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/newtex.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF"
    },
    ios: {
      bundleIdentifier: "com.juta.cnb",
      buildNumber: "2",
      supportsTablet: true,
      icon: "./assets/images/newtex-square.png",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to location to show the office locations on the map.",
        NSLocationAlwaysUsageDescription: "This app needs access to location to show the office locations on the map."
      }
    },
    android: {
      package: "com.juta.cnb",
      versionCode: 8,
      adaptiveIcon: {
        foregroundImage: "./assets/images/newtex-square.png",
        backgroundColor: "#FFFFFF"
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.RECORD_AUDIO"
      ],
      icon: "./assets/images/newtex-square.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/newtex.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFFFFF"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "The app accesses your photos to let you share them with your friends."
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    extra: {
      router: {
        origin: false
      },
      // Environment variables that will be available in the app
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
      eas: {
        projectId: "0160dfa3-6a1b-480f-9275-a1f26dc7826a"
      }
    },
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/151b57ce-bc3b-4490-8b1a-076e7828c2f2"
    },
    owner: "ferazfhansurie"
  }
};