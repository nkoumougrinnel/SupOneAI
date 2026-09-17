# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations
-keepattributes *Annotation*

# Keep JavaScript interface for WebView (Capacitor)
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Capacitor - keep Capacitor bridge classes
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugins.** { *; }

# Firebase (if used)
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep Gson TypeToken if used
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken

# Keep R8 from removing interface methods needed for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Optimize: remove unused code
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# Don't warn about missing classes
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe
-dontwarn android.support.**
