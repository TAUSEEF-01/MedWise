import React, { useState, useRef } from "react";
import * as Clipboard from "expo-clipboard";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { ChatMessage } from "@/types/medical";
import { geminiApi } from "@/services/geminiApi";
import { SafeAreaView } from "react-native";

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! I'm your MedWise AI assistant powered by Gemini. I can help you with general health information, explain medical terms, and provide lifestyle advice. I can also analyze medical images you share with me. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim() || "Shared a medical image",
      isUser: true,
      timestamp: new Date(),
      type: selectedImage ? "image" : "text",
      imageUri: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setSelectedImage(null);
    setIsTyping(true);

    try {
      let messageText: string;

      if (selectedImage) {
        // Medical-focused image analysis prompt
        messageText = `You are a medical AI assistant analyzing a medical image. Please assume this image is related to healthcare and provide a comprehensive medical analysis:

MEDICAL IMAGE ANALYSIS:
1. Describe what you observe in this medical image (symptoms, conditions, anatomical features, medical documents, etc.)
2. Identify potential medical conditions, symptoms, or findings that could be related to what's shown
3. Explain possible causes or underlying factors
4. Recommend appropriate medical actions or next steps
5. Suggest when immediate medical attention might be needed
6. Provide relevant health education or prevention tips

Additional patient context: ${
          inputText.trim() ||
          "Patient has not provided additional symptoms or context."
        }

Important: Always treat this as a medical consultation image and emphasize the importance of professional medical evaluation for accurate diagnosis and treatment. Focus on educational information while being helpful and supportive.`;
      } else {
        messageText = userMessage.text;
      }

      const aiResponse = await geminiApi.generateResponse(messageText);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const openCamera = async () => {
    closeImageModal();
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    }
  };

  const openGallery = async () => {
    closeImageModal();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.granted) {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const quickActions = [
    {
      title: "Symptoms",
      icon: "healing",
      query: "Tell me about common symptoms and when to see a doctor",
    },
    {
      title: "Lifestyle",
      icon: "fitness-center",
      query: "Give me tips for maintaining a healthy lifestyle",
    },
    {
      title: "Medications",
      icon: "medication",
      query: "How should I properly take medications?",
    },
    {
      title: "Image Analysis",
      icon: "image",
      query: "How can I share medical images for analysis?",
    },
    {
      title: "Emergency",
      icon: "emergency",
      query: "What should I do in a medical emergency?",
    },
  ];

  //const handleQuickAction = (query: string) => setInputText(query);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f3fa" }}>
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.isUser ? styles.userAlign : styles.aiAlign,
            ]}
          >
            {!message.isUser && (
              <View style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={20} color="white" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
                {
                  marginLeft: message.isUser ? 40 : 0,
                  marginRight: message.isUser ? 0 : 40,
                  borderBottomRightRadius: message.isUser ? 8 : 20,
                  borderBottomLeftRadius: message.isUser ? 20 : 8,
                  minWidth: 80,
                },
              ]}
            >
              {message.type === "image" && message.imageUri && (
                <Image
                  source={{ uri: message.imageUri }}
                  style={{
                    width: 180,
                    height: 120,
                    borderRadius: 12,
                    marginBottom: 8,
                    alignSelf: "center",
                  }}
                  resizeMode="cover"
                />
              )}
              <TouchableOpacity
                onLongPress={() => {
                  Clipboard.setStringAsync(message.text);
                  Alert.alert(
                    "Copied to Clipboard",
                    "Message has been copied."
                  );
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: "#1e293b",
                    fontSize: 15,
                    lineHeight: 22,
                    fontWeight: message.isUser ? "500" : "400",
                  }}
                >
                  {message.text}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  marginTop: 4,
                  alignSelf: "flex-end",
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            {message.isUser && (
              <View style={styles.userAvatar}>
                <MaterialIcons name="person" size={20} color="white" />
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name="smart-toy" size={18} color="white" />
            </View>
            <View style={styles.typingIndicator}>
              <Text style={{ fontStyle: "italic", color: "#475569" }}>
                AI is thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View
        style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderColor: "#e5e7eb",
          borderTopWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "flex-end",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={{ marginBottom: 8, marginRight: 10 }}>
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#b1c9ef",
                }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={removeSelectedImage}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#e63946",
                  borderWidth: 2,
                  borderColor: "#fff",
                  zIndex: 2,
                }}
              >
                <MaterialIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={openImageModal}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f3fa",
            marginRight: 10,
            borderWidth: 1,
            borderColor: "#b1c9ef",
          }}
        >
          <MaterialIcons name="add-a-photo" size={22} color="#395886" />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            backgroundColor: "#f0f3fa",
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 8,
            marginRight: 10,
            borderWidth: 1.5,
            borderColor:
              isInputFocused || inputText.trim() ? "#395886" : "#e5e7eb",
            minHeight: 44,
            maxHeight: 100,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              selectedImage
                ? "Describe your symptoms or concerns about this image..."
                : "Ask about symptoms, medications, lifestyle..."
            }
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            style={{
              color: "#1e293b",
              fontSize: 16,
              minHeight: 28,
              padding: 0,
              margin: 0,
            }}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
        </View>
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!inputText.trim() && !selectedImage}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              (inputText.trim() || selectedImage) && !isTyping
                ? "#395886"
                : "#b1c9ef",
            shadowColor: "#395886",
            shadowOpacity: 0.15,
            shadowRadius: 4,
            marginLeft: 2,
          }}
        >
          <MaterialIcons name="send" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Image Upload Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeImageModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeImageModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalContent,
              {
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 32,
                paddingBottom: 24,
                paddingHorizontal: 24,
                backgroundColor: "#fff",
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 10,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                width: 48,
                height: 5,
                backgroundColor: "#e0e0e0",
                borderRadius: 3,
                alignSelf: "center",
                marginBottom: 18,
              }}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#395886",
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Add Medical Image
            </Text>
            <Text
              style={{
                color: "#64748b",
                textAlign: "center",
                marginBottom: 18,
                fontSize: 14,
              }}
            >
              Share a medical document, X-ray, skin condition, or symptom photo
              for AI analysis
            </Text>

            <View style={{ marginBottom: 18 }}>
              <TouchableOpacity
                onPress={openCamera}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f0f3fa",
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: "#b1c9ef",
                  shadowColor: "#395886",
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "#395886",
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <MaterialIcons name="camera-alt" size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      color: "#395886",
                    }}
                  >
                    Take Photo
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>
                    Capture with camera
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openGallery}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f0f3fa",
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: "#b1c9ef",
                  shadowColor: "#395886",
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "#395886",
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <MaterialIcons name="photo-library" size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      color: "#395886",
                    }}
                  >
                    Choose from Gallery
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>
                    Select from photos
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={closeImageModal}
              style={{
                backgroundColor: "#f0f3fa",
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "#e5e7eb",
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: "#395886",
                  textAlign: "center",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <View style={{ height: 12 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0f3fa",
  },
  scrollViewContent: {
    paddingVertical: 16,
    paddingBottom: 120,
  },
  messageRow: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  userAlign: {
    justifyContent: "flex-end",
    marginLeft: 4, // Pushes AI bubble to the left
  },
  aiAlign: {
    justifyContent: "flex-start",
    marginRight: 4, // Pushes AI bubble to the left
  },
  aiAvatar: {
    width: 20,
    height: 20,
    backgroundColor: "#b1c9ef",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 4,
  },
  userAvatar: {
    width: 20,
    height: 20,
    backgroundColor: "#d5deef",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: 4,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: "#d5deef",
    borderColor: "#2c4468",
    marginLeft: 4, // Push user bubble to right
  },
  aiBubble: {
    backgroundColor: "#b1c9ef",
    borderColor: "#2c4468",
    marginRight: 4, // Push AI bubble to left
  },
  userText: {
    color: "#000",
    fontSize: 14,
    lineHeight: 15,
  },
  aiText: {
    color: "#1e293b",
    fontSize: 14,
    lineHeight: 20,
  },
  userTimestamp: {
    color: "#475569",
    fontSize: 10,
    marginTop: 1,
  },
  aiTimestamp: {
    color: "#475569",
    fontSize: 10,
    marginTop: 1,
  },
  typingContainer: {
    flexDirection: "row",
    marginHorizontal: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  typingIndicator: {
    backgroundColor: "#b1c9ef",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  quickActionContainer: {
    backgroundColor: "#f0f3fa",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 16,
  },
  quickActionTitle: {
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f3fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    marginRight: 12,
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  quickActionText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: "#f0f3fa",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInputBox: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 3,
    marginRight: 12,
    maxHeight: 120,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // New styles for image upload modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonsContainer: {
    marginBottom: 16,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f3fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modalButtonIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#395886",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalButtonTextContainer: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  modalButtonSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  modalCancelButton: {
    backgroundColor: "#f0f3fa",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e63946",
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f3fa",
    marginRight: 8,
  },
});
