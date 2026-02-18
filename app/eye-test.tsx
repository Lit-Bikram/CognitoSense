import { useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EyeTestScreen() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const webViewRef = React.useRef<any>(null);
  // ================= MOBILE =================
  if (Platform.OS !== "web") {
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
      if (!permission?.granted) requestPermission();
    }, []);

    useEffect(() => {
      async function loadHtml() {
        const asset = Asset.fromModule(require("../assets/eye_test.html"));
        await asset.downloadAsync();
        const fileUri = asset.localUri!;
        const content = await FileSystem.readAsStringAsync(fileUri);
        setHtmlContent(content);
      }
      loadHtml();
    }, []);

    if (!permission)
      return (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      );
    if (!permission.granted)
      return (
        <View style={styles.loading}>
          <Text style={styles.text}>Camera permission needed.</Text>
        </View>
      );

    if (!htmlContent)
      return (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      );

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef} // ✅ IMPORTANT
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          /* --- STEP A: Ask React Native for the userId --- */
          injectedJavaScript={`
    window.ReactNativeWebView.postMessage("GET_USER");
    true;
  `}
          /* --- STEP B: Receive userId from React Native and send it into the page --- */
          onMessage={async (event) => {
            if (event.nativeEvent.data === "GET_USER") {
              const uid = await AsyncStorage.getItem("currentUserId");

              if (!uid) {
                console.error("No stored userId found!");
                return;
              }

              webViewRef.current?.injectJavaScript(`
        localStorage.setItem("currentUserId", "${uid}");
        console.log("UserId set in WebView:", "${uid}");
      `);
            }
          }}
        />
      </View>
    );
  }

  // ================= WEB (PC) =================
  return (
    <View style={styles.container}>
      <iframe
        src={require("../assets/eye_test.html")}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="camera; microphone"
        title="Eye Test"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  text: { color: "white" },
});
