import { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    BackHandler,
    Platform,
    Text,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const BASE_URL = 'https://politografisi.online';
const ALLOWED_ORIGINS = ['politografisi.online', 'politografisi.firebaseapp.com', 'accounts.google.com', 'apis.google.com'];

// Platform-specific user-agent strings — hide WebView markers that Google blocks for OAuth
const USER_AGENTS = {
    android:
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.178 Mobile Safari/537.36',
    ios:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
};

// Injected BEFORE content loads.
// CRITICAL FIX: Firebase signInWithRedirect saves OAuth state in sessionStorage.
// Android WebView clears sessionStorage on navigation, breaking the auth flow.
//
// Fix: Override sessionStorage.setItem/removeItem/clear to ALWAYS mirror to
// localStorage in real-time. On each page load, restore mirrored keys back.
// Also sets IS_NATIVE_APP flag and adds .is-native-app CSS class to <html>.
const INJECTED_BEFORE = `
(function() {
  var MIRROR_PREFIX = '__ss_mirror__';

  // ─── Restore mirrored sessionStorage on page load ────────────────────────
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var lk = localStorage.key(i);
      if (lk && lk.indexOf(MIRROR_PREFIX) === 0) {
        var ssKey = lk.slice(MIRROR_PREFIX.length);
        if (!sessionStorage.getItem(ssKey)) {
          sessionStorage.setItem(ssKey, localStorage.getItem(lk));
        }
      }
    }
  } catch(e) {}

  // ─── Override sessionStorage to mirror every write to localStorage ────────
  try {
    var _origSet    = sessionStorage.setItem.bind(sessionStorage);
    var _origRemove = sessionStorage.removeItem.bind(sessionStorage);
    var _origClear  = sessionStorage.clear.bind(sessionStorage);

    sessionStorage.setItem = function(key, value) {
      _origSet(key, value);
      try { localStorage.setItem(MIRROR_PREFIX + key, value); } catch(e) {}
    };

    sessionStorage.removeItem = function(key) {
      _origRemove(key);
      try { localStorage.removeItem(MIRROR_PREFIX + key); } catch(e) {}
    };

    sessionStorage.clear = function() {
      _origClear();
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf(MIRROR_PREFIX) === 0) localStorage.removeItem(k);
        }
      } catch(e) {}
    };
  } catch(e) {}

  // ─── Native app flags ─────────────────────────────────────────────────────
  window.IS_NATIVE_APP = true;
  window.NATIVE_PLATFORM = '${Platform.OS}';

  // Add CSS class so the web app can hide PWA prompts, footer links, etc.
  document.documentElement.classList.add('is-native-app');
})();
true;
`;


export default function App() {
    const webViewRef = useRef<WebView>(null);
    const insets = useSafeAreaInsets();
    const [canGoBack, setCanGoBack] = useState(false);
    // KEY FIX: only show spinner on the VERY FIRST load
    const [initialLoading, setInitialLoading] = useState(true);
    const firstLoadDone = useRef(false);
    const [hasError, setHasError] = useState(false);

    // Android hardware back button
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        });
        return () => sub.remove();
    }, [canGoBack]);

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        setCanGoBack(navState.canGoBack);
    };

    // Only hide spinner after the very first page finishes loading
    const handleLoadEnd = () => {
        if (!firstLoadDone.current) {
            firstLoadDone.current = true;
            setInitialLoading(false);
            SplashScreen.hideAsync();
        }
    };

    // Intercept navigation requests — open external links in system browser
    const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
        const { url } = request;

        // Allow internal navigation and OAuth flows
        if (ALLOWED_ORIGINS.some((origin) => url.includes(origin))) {
            return true;
        }

        // Allow about:blank, data:, javascript: etc.
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return true;
        }

        // External link — open in system browser
        Linking.openURL(url).catch(() => { });
        return false;
    };

    // iOS: WebView content process can be killed by the OS — reload gracefully
    const handleContentProcessTerminated = () => {
        webViewRef.current?.reload();
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={false} />

            <WebView
                ref={webViewRef}
                source={{ uri: BASE_URL }}
                style={styles.webview}
                scalesPageToFit={false}
                originWhitelist={['*']}
                setSupportMultipleWindows={false}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE}
                onNavigationStateChange={handleNavigationStateChange}
                onShouldStartLoadWithRequest={handleShouldStartLoad}
                onLoadEnd={handleLoadEnd}
                onContentProcessDidTerminate={handleContentProcessTerminated}
                onError={() => {
                    if (!firstLoadDone.current) {
                        firstLoadDone.current = true;
                        setInitialLoading(false);
                        setHasError(true);
                        SplashScreen.hideAsync();
                    }
                }}
                onHttpError={() => {
                    if (!firstLoadDone.current) {
                        firstLoadDone.current = true;
                        setInitialLoading(false);
                        SplashScreen.hideAsync();
                    }
                }}
                pullToRefreshEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsBackForwardNavigationGestures
                userAgent={Platform.OS === 'ios' ? USER_AGENTS.ios : USER_AGENTS.android}
                mixedContentMode="always"
            />

            {/* Initial loading overlay — shows ONLY on first page load */}
            {initialLoading && (
                <View style={styles.loader} pointerEvents="none">
                    <Text style={styles.loaderLogo}>📚</Text>
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 12 }} />
                    <Text style={styles.loaderText}>Politografisi.online</Text>
                </View>
            )}

            {/* Offline error screen */}
            {hasError && (
                <View style={styles.errorScreen}>
                    <Text style={styles.errorIcon}>📡</Text>
                    <Text style={styles.errorTitle}>Δεν υπάρχει Σύνδεση</Text>
                    <Text style={styles.errorText}>
                        Ελέγξτε τη σύνδεσή σας στο internet και δοκιμάστε ξανά.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => {
                            setHasError(false);
                            firstLoadDone.current = false;
                            setInitialLoading(true);
                            webViewRef.current?.reload();
                        }}
                    >
                        <Text style={styles.retryText}>Δοκιμή Ξανά</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },
    webview: { flex: 1, backgroundColor: '#020617' },
    loader: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020617',
        zIndex: 10,
    },
    loaderLogo: { fontSize: 52 },
    loaderText: { marginTop: 8, color: '#64748b', fontSize: 13, fontWeight: '600' },
    errorScreen: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#020617',
        paddingHorizontal: 40,
        zIndex: 10,
    },
    errorIcon: { fontSize: 56, marginBottom: 16 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 8 },
    errorText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    retryBtn: { backgroundColor: '#1d4ed8', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
    retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

