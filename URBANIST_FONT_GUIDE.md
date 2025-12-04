# Urbanist Font Implementation Guide

## Setup

Font Urbanist telah diimplementasikan sebagai default font untuk seluruh aplikasi menggunakan best practice pattern.

### Struktur

1. **FontContext** (`context/FontContext.tsx`)
   - Global font provider yang memuat Urbanist fonts di root level
   - Menghindari multiple font loading di setiap screen

2. **ThemedText Component** (`components/ThemedText.tsx`)
   - Custom Text component dengan Urbanist sebagai default
   - Support 3 variants: `regular`, `semibold`, `bold`

## Usage

### 1. Menggunakan ThemedText Component (Recommended)

```tsx
import { ThemedText } from "@/components/ThemedText";

// Default (regular)
<ThemedText>Hello World</ThemedText>

// Semibold
<ThemedText variant="semibold">Hello World</ThemedText>

// Bold
<ThemedText variant="bold">Hello World</ThemedText>

// Dengan custom style
<ThemedText style={{ fontSize: 16, color: "#333" }}>
  Hello World
</ThemedText>
```

### 2. Menggunakan Native Text dengan fontFamily

Jika perlu menggunakan native `Text` component:

```tsx
import { Text } from "react-native";
import { useFont } from "@/context/FontContext";

const { fontsLoaded } = useFont();

if (!fontsLoaded) return null;

<Text style={{ fontFamily: "Urbanist_400Regular" }}>Hello</Text>
<Text style={{ fontFamily: "Urbanist_600SemiBold" }}>Hello</Text>
<Text style={{ fontFamily: "Urbanist_700Bold" }}>Hello</Text>
```

## Font Variants

- **Urbanist_400Regular** - Regular weight (default)
- **Urbanist_600SemiBold** - Semibold weight
- **Urbanist_700Bold** - Bold weight

## Migration Guide

### Existing Screens

Untuk screen yang sudah ada, ada 2 cara:

#### Option 1: Replace Text dengan ThemedText (Recommended)

```tsx
// Before
import { Text } from "react-native";
<Text style={styles.title}>Hello</Text>;

// After
import { ThemedText } from "@/components/ThemedText";
<ThemedText style={styles.title}>Hello</ThemedText>;
```

#### Option 2: Tambahkan fontFamily di StyleSheet

```tsx
const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "600",
    // Tambahkan ini
    fontFamily: "Urbanist_600SemiBold",
  },
});
```

### Mapping fontWeight ke Font Variant

- `fontWeight: "400"` atau `"normal"` → `Urbanist_400Regular`
- `fontWeight: "600"` → `Urbanist_600SemiBold`
- `fontWeight: "700"` atau `"bold"` → `Urbanist_700Bold`

**Note**: Jika menggunakan `fontFamily`, hapus property `fontWeight` karena weight sudah included dalam font name.

## Benefits

✅ Konsisten font di seluruh aplikasi
✅ Single source of truth untuk font loading
✅ Mudah maintenance dan update
✅ Performance optimization (font loaded once at root)
✅ Type-safe dengan TypeScript
✅ Reusable ThemedText component

## Example

```tsx
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet, View } from "react-native";

export default function MyScreen() {
  return (
    <View>
      <ThemedText variant="bold" style={styles.title}>
        Title Text
      </ThemedText>
      <ThemedText variant="semibold" style={styles.subtitle}>
        Subtitle Text
      </ThemedText>
      <ThemedText style={styles.body}>Body Text</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, color: "#000" },
  subtitle: { fontSize: 18, color: "#333" },
  body: { fontSize: 14, color: "#666" },
});
```
