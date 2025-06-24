// import React, { useState } from "react";
// import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { MaterialIcons } from "@expo/vector-icons";

// import type { IconProps } from "@expo/vector-icons/build/createIconSet";
// import type { ComponentProps } from "react";
// type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

// const privacyActions: {
//   icon: MaterialIconName;
//   color: string;
//   title: string;
//   subtitle: string;
//   key: string;
// }[] = [
//   {
//     icon: "share",
//     color: "#2563eb",
//     title: "Allow sharing reports with authorized doctors",
//     subtitle: "Enable/disable sharing with doctors",
//     key: "shareReports",
//   },
//   {
//     icon: "contact-phone",
//     color: "#059669",
//     title: "Allow emergency contact access",
//     subtitle: "Let your emergency contact access your info",
//     key: "emergencyAccess",
//   },
//   {
//     icon: "file-download",
//     color: "#22c55e",
//     title: "Download my medical data",
//     subtitle: "Export your medical data",
//     key: "downloadData",
//   },
//   {
//     icon: "delete-forever",
//     color: "#ef4444",
//     title: "Delete my account & data",
//     subtitle: "Permanently remove your account",
//     key: "deleteAccount",
//   },
//   {
//     icon: "history",
//     color: "#a21caf",
//     title: "Clear chatbot history",
//     subtitle: "Remove all your chatbot conversations",
//     key: "clearHistory",
//   },
//   {
//     icon: "notifications-active",
//     color: "#f59e0b",
//     title: "Show health notifications on lock screen",
//     subtitle: "Enable/disable lock screen notifications",
//     key: "lockScreenNotifications",
//   },
//   {
//     icon: "fingerprint",
//     color: "#395886",
//     title: "Enable biometric lock",
//     subtitle: "Require fingerprint or face unlock",
//     key: "biometricLock",
//   },
// ];

// type PrivacyActionsModalProps = {
//   visible: boolean;
//   onClose: () => void;
//   onAction: (key: string) => void;
// };

// export function PrivacyActionsModal({ visible, onClose, onAction }: PrivacyActionsModalProps) {
//   return (
//     <Modal
//       visible={visible}
//       animationType="slide"
//       transparent
//       onRequestClose={onClose}
//     >
//       <TouchableOpacity
//         style={styles.overlay}
//         activeOpacity={1}
//         onPress={onClose}
//       >
//         <TouchableOpacity
//           activeOpacity={1}
//           style={styles.modalContent}
//           onPress={e => e.stopPropagation()}
//         >
//           <View style={styles.handle} />
//           <Text style={styles.title}>Privacy Settings</Text>
//           <Text style={styles.subtitle}>Manage your privacy options</Text>
//           {privacyActions.map(action => (
//             <TouchableOpacity
//               key={action.key}
//               style={[styles.actionButton, { borderColor: action.color + "33" }]}
//               onPress={() => onAction(action.key)}
//             >
//               <View style={[styles.iconCircle, { backgroundColor: action.color + "22" }]}>
//                 <MaterialIcons name={action.icon} size={24} color={action.color} />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Text style={styles.actionTitle}>{action.title}</Text>
//                 <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
//               </View>
//               <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
//             </TouchableOpacity>
//           ))}
//           <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//             <Text style={styles.cancelText}>Cancel</Text>
//           </TouchableOpacity>
//         </TouchableOpacity>
//       </TouchableOpacity>
//     </Modal>
//   );
// }
// export default PrivacyActionsModal;

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.15)",
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 20,
//     paddingBottom: 32,
//   },
//   handle: {
//     width: 48,
//     height: 5,
//     backgroundColor: "#e5e7eb",
//     borderRadius: 3,
//     alignSelf: "center",
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#22223b",
//     textAlign: "center",
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#6b7280",
//     textAlign: "center",
//     marginBottom: 16,
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#f0f3fa",
//     borderRadius: 14,
//     borderWidth: 1,
//     paddingVertical: 14,
//     paddingHorizontal: 12,
//     marginBottom: 12,
//   },
//   iconCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 14,
//   },
//   actionTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#22223b",
//   },
//   actionSubtitle: {
//     fontSize: 12,
//     color: "#6b7280",
//   },
//   cancelButton: {
//     backgroundColor: "#f0f3fa",
//     borderRadius: 14,
//     paddingVertical: 14,
//     marginTop: 8,
//     alignItems: "center",
//   },
//   cancelText: {
//     fontSize: 16,
//     color: "#374151",
//     fontWeight: "600",
//   },
// });



// import React, { useState } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Switch,
//   Dimensions,
// } from "react-native";
// import { MaterialIcons } from "@expo/vector-icons";

// const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

// const privacyActions = [
//   {
//     icon: "share",
//     color: "#2563eb",
//     title: "Allow sharing reports with authorized doctors",
//     key: "shareReports",
//   },
//   {
//     icon: "contact-phone",
//     color: "#059669",
//     title: "Allow emergency contact access",
//     key: "emergencyAccess",
//   },
//   {
//     icon: "file-download",
//     color: "#22c55e",
//     title: "Download my medical data",
//     key: "downloadData",
//   },
//   {
//     icon: "delete-forever",
//     color: "#ef4444",
//     title: "Delete my account & data",
//     key: "deleteAccount",
//   },
//   {
//     icon: "history",
//     color: "#a21caf",
//     title: "Clear chatbot history",
//     key: "clearHistory",
//   },
//   {
//     icon: "notifications-active",
//     color: "#f59e0b",
//     title: "Show health notifications on lock screen",
//     key: "lockScreenNotifications",
//   },
//   {
//     icon: "fingerprint",
//     color: "#395886",
//     title: "Enable biometric lock",
//     key: "biometricLock",
//   },
// ];

// type PrivacyActionsModalProps = {
//   visible: boolean;
//   onClose: () => void;
//   onAction: (key: string, value: boolean) => void;
// };

// export default function PrivacyActionsModal({
//   visible,
//   onClose,
//   onAction,
// }: PrivacyActionsModalProps) {
//   const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});

//   const toggleSwitch = (key: string) => {
//     const newValue = !switchStates[key];
//     setSwitchStates((prev) => ({ ...prev, [key]: newValue }));
//     onAction(key, newValue);
//   };

//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
//         <TouchableOpacity
//           activeOpacity={1}
//           style={[styles.modalContent, { maxHeight: SCREEN_HEIGHT * 0.55 }]}
//           onPress={(e) => e.stopPropagation()}
//         >
//           <View style={styles.headerRow}>
//             <Text style={styles.title}>Privacy Settings</Text>
//             <TouchableOpacity onPress={onClose}>
//               <MaterialIcons name="close" size={24} color="#6b7280" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView showsVerticalScrollIndicator={false}>
//             {privacyActions.map((action) => (
//               <View key={action.key} style={styles.actionRow}>
//                 <View style={[styles.iconCircle, { backgroundColor: action.color + "22" }]}>
//                   <MaterialIcons name={action.icon as MaterialIconName} size={22} color={action.color} />
//                 </View>
//                 <Text style={styles.actionTitle} numberOfLines={2}>{action.title}</Text>
//                 <Switch
//                   trackColor={{ false: "#d1d5db", true: action.color }}
//                   thumbColor={switchStates[action.key] ? "#fff" : "#9ca3af"}
//                   value={!!switchStates[action.key]}
//                   onValueChange={() => toggleSwitch(action.key)}
//                 />
//               </View>
//             ))}
//           </ScrollView>
//         </TouchableOpacity>
//       </TouchableOpacity>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.2)",
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     backgroundColor: "#fff",
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     padding: 16,
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#1f2937",
//   },
//   actionRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//   },
//   iconCircle: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   actionTitle: {
//     flex: 1,
//     fontSize: 14,
//     color: "#374151",
//   },
// });



import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type MaterialIconName = keyof typeof MaterialIcons.glyphMap;

const privacyActions = [
  {
    icon: "share",
    title: "Allow sharing reports with authorized doctors",
    key: "shareReports",
  },
  {
    icon: "contact-phone",
    title: "Allow emergency contact access",
    key: "emergencyAccess",
  },
  {
    icon: "file-download",
    title: "Download my medical data",
    key: "downloadData",
  },
  {
    icon: "delete-forever",
    title: "Delete my account & data",
    key: "deleteAccount",
  },
  {
    icon: "history",
    title: "Clear chatbot history",
    key: "clearHistory",
  },
  {
    icon: "notifications-active",
    title: "Show health notifications on lock screen",
    key: "lockScreenNotifications",
  },
  {
    icon: "fingerprint",
    title: "Enable biometric lock",
    key: "biometricLock",
  },
];

type PrivacyActionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onAction: (key: string, value: boolean) => void;
};

export default function PrivacyActionsModal({
  visible,
  onClose,
  onAction,
}: PrivacyActionsModalProps) {
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});

  const toggleSwitch = (key: string) => {
    const newValue = !switchStates[key];
    setSwitchStates((prev) => ({ ...prev, [key]: newValue }));
    onAction(key, newValue);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalContent, { maxHeight: SCREEN_HEIGHT * 0.55 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Privacy Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {privacyActions.map((action) => (
              <View key={action.key} style={styles.actionRow}>
                <MaterialIcons
                  name={action.icon as MaterialIconName}
                  size={22}
                  color="#395886"
                  style={{ marginRight: 12 }}
                />
                <Text style={styles.actionTitle} numberOfLines={2}>
                  {action.title}
                </Text>
                <Switch
                  trackColor={{ false: "#d1d5db", true: "#395886" }}
                  thumbColor={switchStates[action.key] ? "#fff" : "#9ca3af"}
                  value={!!switchStates[action.key]}
                  onValueChange={() => toggleSwitch(action.key)}
                />
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  actionTitle: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
});
