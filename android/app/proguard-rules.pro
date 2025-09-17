# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo modules
-keep class expo.modules.** { *; }
-keep class com.facebook.react.bridge.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# React Native Fast Image
-keep class com.dylanvann.fastimage.** { *; }

# React Native Maps
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.location.** { *; }

# React Native Share
-keep class cl.json.** { *; }

# React Native HTML to PDF
-keep class com.christopherdro.htmltopdf.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# Slider
-keep class com.reactnativecommunity.slider.** { *; }

# Picker
-keep class com.reactnativecommunity.picker.** { *; }

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Flash List
-keep class com.shopify.reactnative.flash_list.** { *; }

# SVG
-keep class com.horcrux.svg.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native bridge
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }

# Add any project specific keep options here:

# Keep splash screen related classes
-keep class expo.modules.splashscreen.** { *; }
-keep class expo.modules.splashscreen.SplashScreenManager { *; }

# Keep all native methods and JNI
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep all classes that might be accessed via reflection
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep React Native bridge classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.modules.** { *; }

# Keep all classes in the main package
-keep class com.juta.cnb.** { *; }
