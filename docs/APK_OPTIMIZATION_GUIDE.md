# APK Optimization Guide — SUP'ONE AI

Ce document décrit les optimisations appliquées pour améliorer les performances, la taille et l'expérience utilisateur de l'APK Android.

## Table des matières

1. [Optimisations Bundle](#1-optimisations-bundle)
2. [Service Worker & Cache](#2-service-worker--cache)
3. [Capacitor Configuration](#3-capacitor-configuration)
4. [Android Build](#4-android-build)
5. [Performance Monitoring](#5-performance-monitoring)
6. [Mesures](#6-mesures)

---

## 1. Optimisations Bundle

### Code Splitting
- Vendor chunk séparé (`react`, `react-dom`) dans `manualChunks`
- CSS code splitting activé
- Terser minification avec `drop_console: true` en production

### Commandes
```bash
# Analyser la taille du bundle
npm run analyze

# Build optimisé
npm run build
```

### Résultats attendus
- Réduction de 30%+ sur la taille JS totale
- Vendor chunk mis en cache séparément

---

## 2. Service Worker & Cache

### Stratégies Workbox
| Ressource | Stratégie | TTL |
|-----------|-----------|-----|
| API (`/api/*`) | NetworkFirst | 12s timeout, 50 entrées, 5min |
| Images (`*.png,*.jpg`) | CacheFirst | 60 entrées, 30 jours |
| Fonts (`*.woff2`) | CacheFirst | 10 entrées, 1 an |
| JS/CSS/HTML | CacheFirst | 200 entrées, 7 jours |

### Cache IndexedDB (cacheManager.js)
- LRU cache pour les réponses chat (max 100 messages)
- TTL de 24h par défaut
- Fuzzy matching pour questions similaires
- Éviction automatique

---

## 3. Capacitor Configuration

### Ajouts capacitor.config.json
- `server.allowNavigation` pour les domains Railway
- `captureInput: true` pour melhor saisie
- `webContentsDebuggingEnabled: false` en prod
- `minWebViewVersion: 90`
- `PushNotifications` config
- `StatusBar.overlaysWebView: false`
- `Keyboard.hideFormAccessoryBar: false`

### Permissions Android
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

---

## 4. Android Build

### Gradle Optimization
- `minifyEnabled true` pour release (R8)
- `shrinkResources true` pour release
- ProGuard rules personnalisées
- `lint.abortOnError false`

### ProGuard Rules
- Classes Capacitor conservées
- Firebase conservées
- Line number info préservée pour stack traces

### Signing
- Keystore: `android/my-release-key.jks`
- **IMPORTANT**: Ajouter `*.jks` au `.gitignore`

### Build Commands
```bash
# Debug
npm run android:build

# Release
npm run android:build:release
```

---

## 5. Performance Monitoring

### Métriques trackées
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **TTI** (Time to Interactive)
- **API response times**

### Envoi au backend
- Buffer de 50 métriques
- Flush toutes les 30 secondes
- Flush sur page visibility hidden

---

## 6. Mesures

### Mesurer avant/après
```bash
# Bundle analyzer
npm run analyze

# Build size
ls -la android/app/build/outputs/apk/release/
```

### Critères d'acceptation
- [ ] APK réduit de 30%+
- [ ] Lighthouse score > 85
- [ ] 0 console errors
- [ ] Service Worker cache fonctionnel
- [ ] Mode hors ligne complet

---

## Dependencies ajoutées

### Runtime
- `idb` — IndexedDB wrapper
- `framer-motion` — Animations
- `react-window` — Virtualisation
- `@capacitor/network` — Détection réseau
- `@capacitor/device` — Info batterie
- `@capacitor/push-notifications` — Push notifications
- `@capacitor/local-notifications` — Notifications locales
- `@capacitor/share` — Partage natif
- `@capacitor/filesystem` — Accès fichiers
- `@capacitor/haptics` — Feedback haptique
- `@sentry/capacitor` — Error tracking

### DevDependencies
- `vite-bundle-visualizer` — Bundle analysis
- `vitest` — Tests unitaires
- `jsdom` — DOM simulation

---

## Fichiers créés/modifiés

### Nouveaux fichiers
```
src/utils/
├── cacheManager.js
├── imageOptimizer.js
├── pushNotifications.js
├── localNotifications.js
├── sharing.js
├── fileManager.js
├── dataOptimizer.js
├── errorTracking.js
├── analytics.js
└── performanceMonitor.js

src/hooks/
├── useCachedChat.js
├── useNetworkStatus.js
├── useBatteryOptimization.js
└── useGestureRecognizer.js

src/components/
├── VirtualizedChatList.jsx
├── AnimatedMessageBubble.jsx
├── ContextMenu.jsx
└── SkeletonLoader.jsx

src/__tests__/
├── setup.js
├── cacheManager.test.js
├── useChat.test.js
└── App.test.jsx

.github/workflows/
├── build-apk.yml
└── build-release.yml

vitest.config.js
```

### Fichiers modifiés
- `vite.config.js` — Code splitting, Terser, Workbox amélioré
- `package.json` — Dependencies, scripts
- `capacitor.config.json` — Config avancée
- `android/app/build.gradle` — R8/ProGuard
- `android/app/src/main/AndroidManifest.xml` — Permissions
- `android/app/proguard-rules.pro` — Rules personnalisées
- `android/app/src/main/res/xml/network_security_config.xml` — Security
- `.gitignore` — Keystore exclus
- `.github/workflows/ci.yml` — Lint + tests ajoutés
