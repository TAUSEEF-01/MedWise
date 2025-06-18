// import React, { useState } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   Switch,
// } from "react-native";
// import { MaterialIcons } from "@expo/vector-icons";

// interface PrivacySettingsSidebarProps {
//   visible: boolean;
//   onClose: () => void;
// }

// const PrivacySettingsSidebar: React.FC<PrivacySettingsSidebarProps> = ({
//   visible,
//   onClose,
// }) => {
//   const [settings, setSettings] = useState({
//     shareReports: false,
//     allowEmergencyAccess: false,
//     downloadData: false,
//     deleteAccount: false,
//     clearHistory: false,
//     showNotifications: false,
//     biometricLock: false,
//   });

//   const toggleSetting = (key: keyof typeof settings) => {
//     setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const options = [
//     {
//       key: "shareReports",
//       label: "Allow sharing reports with authorized doctors",
//       icon: "share",
//     },
//     {
//       key: "allowEmergencyAccess",
//       label: "Allow emergency contact access",
//       icon: "contact-phone",
//     },
//     {
//       key: "downloadData",
//       label: "Download my medical data",
//       icon: "file-download",
//     },
//     {
//       key: "deleteAccount",
//       label: "Delete my account & data",
//       icon: "delete",
//     },
//     {
//       key: "clearHistory",
//       label: "Clear chatbot history",
//       icon: "history",
//     },
//     {
//       key: "showNotifications",
//       label: "Show health notifications on lock screen",
//       icon: "notifications-active",
//     },
//     {
//       key: "biometricLock",
//       label: "Enable biometric lock",
//       icon: "fingerprint",
//     },
//   ];

//   return (
//     <Modal visible={visible} animationType="slide" transparent={true}>
//       <View className="flex-1 flex-row">
//         {/* Sidebar */}
//         <View className="w-72 bg-[#f0f3fa] p-4 shadow-lg">
//           <Text className="text-2xl font-bold text-gray-900 mb-4">
//             Privacy Settings
//           </Text>

//           <ScrollView>
//             {options.map((item, index) => (
//               <View key={item.key} className="border-b border-gray-300 py-3 flex-row items-center">
//                 <MaterialIcons name={item.icon as any} size={22} color="#395886" />
//                 <Text className="flex-1 ml-3 text-gray-800 text-base pr-2">{item.label}</Text>
//                 <Switch
//                   value={settings[item.key as keyof typeof settings]}
//                   onValueChange={() => toggleSetting(item.key as keyof typeof settings)}
//                   thumbColor={settings[item.key as keyof typeof settings] ? "#395886" : "#ccc"}
//                   trackColor={{ true: "#bfdbfe", false: "#e5e7eb" }}
//                 />
//               </View>
//             ))}
//           </ScrollView>
//         </View>

//         {/* Transparent clickable area to close */}
//         <TouchableOpacity className="flex-1" onPress={onClose} />
//       </View>
//     </Modal>
//   );
// };

// export default PrivacySettingsSidebar;


import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface PrivacySettingsSidebarProps {
  visible: boolean;
  onClose: () => void;
}

const PrivacySettingsSidebar: React.FC<PrivacySettingsSidebarProps> = ({
  visible,
  onClose,
}) => {
  const [settings, setSettings] = useState({
    shareReports: false,
    allowEmergencyAccess: false,
    downloadData: false,
    deleteAccount: false,
    clearHistory: false,
    showNotifications: false,
    biometricLock: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const options = [
    {
      key: "shareReports",
      label: "Allow sharing reports with authorized doctors",
      icon: "share",
    },
    {
      key: "allowEmergencyAccess",
      label: "Allow emergency contact access",
      icon: "contact-phone",
    },
    {
      key: "downloadData",
      label: "Download my medical data",
      icon: "file-download",
    },
    {
      key: "deleteAccount",
      label: "Delete my account & data",
      icon: "delete",
    },
    {
      key: "clearHistory",
      label: "Clear chatbot history",
      icon: "history",
    },
    {
      key: "showNotifications",
      label: "Show health notifications on lock screen",
      icon: "notifications-active",
    },
    {
      key: "biometricLock",
      label: "Enable biometric lock",
      icon: "fingerprint",
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 flex-row">
        {/* Sidebar */}
        <View className="w-72 bg-[#f0f3fa] p-4 shadow-lg relative">
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute right-3 top-3 z-10 p-1"
          >
            <MaterialIcons name="close" size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Privacy Settings
          </Text>

          <ScrollView>
            {options.map((item) => (
              <View
                key={item.key}
                className="border-b border-gray-300 py-3 flex-row items-center"
              >
                <MaterialIcons name={item.icon as any} size={22} color="#395886" />
                <Text className="flex-1 ml-3 text-gray-800 text-base pr-2">
                  {item.label}
                </Text>
                <Switch
                  value={settings[item.key as keyof typeof settings]}
                  onValueChange={() => toggleSetting(item.key as keyof typeof settings)}
                  thumbColor={
                    settings[item.key as keyof typeof settings] ? "#395886" : "#ccc"
                  }
                  trackColor={{ true: "#bfdbfe", false: "#e5e7eb" }}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Transparent clickable area to close */}
        <TouchableOpacity className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  );
};

export default PrivacySettingsSidebar;
