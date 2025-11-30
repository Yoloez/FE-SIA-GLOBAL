# Custom Alert Implementation Guide

## ✅ Files Already Updated with CustomAlert:

- `app/(mahasiswa)/profil.tsx` - Logout confirmation & error handling
- `app/(mahasiswa)/jadwal.tsx` - Schedule loading error handling

## 📝 How to Replace Alert with CustomAlert

### Step 1: Import CustomAlert

```typescript
import CustomAlert from "../../components/CustomAlert";
// Remove Alert from react-native imports
```

### Step 2: Add Alert State

```typescript
const [alertConfig, setAlertConfig] = useState({
  visible: false,
  title: "",
  message: "",
  buttons: [] as { text: string; onPress: () => void; style?: "cancel" | "destructive" }[],
});
```

### Step 3: Replace Alert.alert() Calls

**Before:**

```typescript
Alert.alert("Error", "Something went wrong");
```

**After:**

```typescript
setAlertConfig({
  visible: true,
  title: "Error",
  message: "Something went wrong",
  buttons: [{ text: "OK", onPress: () => {} }],
});
```

**Before (with multiple buttons):**

```typescript
Alert.alert("Konfirmasi", "Are you sure?", [
  { text: "Cancel", style: "cancel" },
  { text: "Delete", style: "destructive", onPress: () => handleDelete() },
]);
```

**After:**

```typescript
setAlertConfig({
  visible: true,
  title: "Konfirmasi",
  message: "Are you sure?",
  buttons: [
    { text: "Cancel", onPress: () => {}, style: "cancel" },
    { text: "Delete", onPress: () => handleDelete(), style: "destructive" },
  ],
});
```

### Step 4: Add CustomAlert Component to Return

```tsx
return (
  <View style={styles.container}>
    {/* Your existing UI */}

    <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertConfig({ ...alertConfig, visible: false })} buttons={alertConfig.buttons} />
  </View>
);
```

## 📋 Files That Still Need Update

### Priority 1 (Mahasiswa - Most Used):

- ✅ `app/(mahasiswa)/profil.tsx` - **DONE**
- ✅ `app/(mahasiswa)/jadwal.tsx` - **DONE**

### Priority 2 (Admin):

- `app/(admin)/index.tsx` - Status change, delete, logout confirmations
- `app/(admin)/AddClasses.tsx` - Form validation errors
- `app/(admin)/[classId].tsx` - Member removal confirmation
- `app/(admin)/ListManager.tsx` - Delete confirmation

### Priority 3 (Dosen):

- `app/(dosen)/ProfilDosen.tsx` - Logout confirmation
- `app/(dosen)/class-grades/[classId].tsx` - Grade submission validation

### Priority 4 (Chat):

- `app/chat/index.tsx` - Error handling
- `app/chat/[conversationId].tsx` - Error handling

### Priority 5 (Shared):

- `app/(shared)/index.tsx` - Status change, delete confirmations
- `app/(shared)/[classId].tsx` - Member removal
- `app/(shared)/CreateClasses.tsx` - Delete confirmation
- `app/(shared)/CreateSubjects.tsx` - Delete confirmation

## 🎨 CustomAlert Features

- **Modern iOS-style design** with rounded corners
- **Semi-transparent overlay** (rgba(0, 0, 0, 0.5))
- **Flexible button layout** with automatic separator
- **Destructive button style** for delete/logout actions
- **Responsive width** (80% of screen)
- **Shadow effects** for depth
- **Auto-close on button press**

## 💡 Best Practices

1. **Always provide meaningful titles and messages**
2. **Use "cancel" style for cancel buttons**
3. **Use "destructive" style for delete/logout buttons**
4. **Keep messages concise and clear**
5. **Provide empty onPress for cancel buttons**: `onPress: () => {}`
6. **Close alert after action**: The component auto-closes when any button is pressed

## 🔄 Pattern for Common Scenarios

### Simple Error Alert

```typescript
setAlertConfig({
  visible: true,
  title: "Error",
  message: "Operation failed",
  buttons: [{ text: "OK", onPress: () => {} }],
});
```

### Success Alert with Navigation

```typescript
setAlertConfig({
  visible: true,
  title: "Success",
  message: "Data saved successfully",
  buttons: [{ text: "OK", onPress: () => router.back() }],
});
```

### Confirmation Dialog

```typescript
setAlertConfig({
  visible: true,
  title: "Confirm Action",
  message: "Are you sure you want to proceed?",
  buttons: [
    { text: "Cancel", onPress: () => {}, style: "cancel" },
    { text: "Confirm", onPress: () => handleAction() },
  ],
});
```

### Destructive Action Confirmation

```typescript
setAlertConfig({
  visible: true,
  title: "Delete Item",
  message: "This action cannot be undone",
  buttons: [
    { text: "Cancel", onPress: () => {}, style: "cancel" },
    { text: "Delete", onPress: () => handleDelete(), style: "destructive" },
  ],
});
```

---

**Note:** CustomAlert automatically closes when any button is pressed, so you don't need to manually close it in button handlers unless you want to perform additional actions before closing.
