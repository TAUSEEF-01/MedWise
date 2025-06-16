import React, { useState, useRef } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { ChatMessage } from "@/types/medical";
import { geminiApi } from "@/services/geminiApi";

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! I'm your MedWise AI assistant powered by Gemini. I can help you with general health information, explain medical terms, and provide lifestyle advice. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const aiResponse = await geminiApi.generateResponse(userMessage.text);

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

  // const quickActions = [
  //   { title: "Symptoms", icon: "healing", query: "Tell me about common symptoms and when to see a doctor" },
  //   { title: "Lifestyle", icon: "fitness-center", query: "Give me tips for maintaining a healthy lifestyle" },
  //   { title: "Medications", icon: "medication", query: "How should I properly take medications?" },
  //   { title: "Emergency", icon: "emergency", query: "What should I do in a medical emergency?" },
  // ];

  //const handleQuickAction = (query: string) => setInputText(query);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
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
                <MaterialIcons name="smart-toy" size={18} color="white" />
              </View>
            )}

            <View style={[styles.bubble, message.isUser ? styles.userBubble : styles.aiBubble]}>
              <Text style={message.isUser ? styles.userText : styles.aiText}>
                {message.text}
              </Text>
              <Text style={message.isUser ? styles.userTimestamp : styles.aiTimestamp}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>

            {message.isUser && (
              <View style={styles.userAvatar}>
                <MaterialIcons name="person" size={18} color="white" />
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

      {/* Quick Actions */}
      {/* <View style={{ backgroundColor: "#f0f3fa", borderTopWidth: 1, borderColor: "#ccc", padding: 16 }}>
  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 12 }}>
    Quick Actions
  </Text>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ flexDirection: "row" }}
  >
    {quickActions.map((action, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleQuickAction(action.query)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#395886",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 9999,
          marginRight: 12,
          borderWidth: 1,
          borderColor: "#2c4468",
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <MaterialIcons
          name={action.icon as any}
          size={16}
          color="white"
        />
        <Text style={{ color: "white", marginLeft: 8, fontSize: 14, fontWeight: "500" }}>
          {action.title}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
 */}

      {/* Input */}
      <View style={{ backgroundColor: "#f0f3fa", borderTopWidth: 1, borderColor: "#ccc", padding: 16, flexDirection: "row", alignItems: "flex-end" }}>
  <View style={{
    flex: 1,
    backgroundColor: "#f0f3fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    maxHeight: 120,
  }}>
    <TextInput
      value={inputText}
      onChangeText={setInputText}
      placeholder="Ask about symptoms, medications, lifestyle..."
      placeholderTextColor="#9ca3af"
      multiline
      maxLength={500}
      style={{
        color: "#000", // Input text in black
        fontSize: 16,
        minHeight: 40,
      }}
    />
  </View>
  <TouchableOpacity
    onPress={sendMessage}
    disabled={!inputText.trim() || isTyping}
    style={{
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: inputText.trim() && !isTyping ? "#395886" : "#ccc",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }}
  >
    <MaterialIcons name="send" size={20} color="white" />
  </TouchableOpacity>
</View>

    </KeyboardAvoidingView>
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
  },
  aiAlign: {
    justifyContent: "flex-start",
    marginRight: 40, // Pushes AI bubble to the left
  },
  aiAvatar: {
    width: 40,
    height: 40,
    backgroundColor: "#b1c9ef",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 4,
  },
  userAvatar: {
    width: 40,
    height: 40,
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
    marginLeft: 40, // Push user bubble to right
  },
  aiBubble: {
    backgroundColor: "#b1c9ef",
    borderColor: "#a3bfe3",
    marginRight: 40, // Push AI bubble to left
  },
  userText: {
    color: "#000",
    fontSize: 16,
    lineHeight: 22,
  },
  aiText: {
    color: "#1e293b",
    fontSize: 16,
    lineHeight: 22,
  },
  userTimestamp: {
    color: "#d1d5db",
    fontSize: 10,
    marginTop: 8,
  },
  aiTimestamp: {
    color: "#475569",
    fontSize: 10,
    marginTop: 8,
  },
  typingContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
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
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  textInputBox: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
