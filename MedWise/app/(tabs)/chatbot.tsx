import React, { useState, useRef } from "react";
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Text, View } from "@/components/Themed";
import { ChatMessage } from "@/types/medical";
import { geminiApi } from "@/services/geminiApi";
import "../../global.css";

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
        text: "I apologize, but I'm experiencing technical difficulties. Please try again later or consult with a healthcare professional for immediate medical concerns.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      title: "Emergency",
      icon: "emergency",
      query: "What should I do in a medical emergency?",
    },
  ];

  const handleQuickAction = (query: string) => {
    setInputText(query);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            className={`mx-4 mb-4 flex-row ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            {!message.isUser && (
              <View className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full items-center justify-center mr-3 mt-1 shadow-lg">
                <MaterialIcons name="smart-toy" size={18} color="white" />
              </View>
            )}
            <View
              className={`max-w-4/5 px-4 py-3 rounded-2xl shadow-lg ${
                message.isUser
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 rounded-br-md"
                  : "bg-white rounded-bl-md border border-gray-100"
              }`}
            >
              <Text
                className={`text-base leading-6 ${
                  message.isUser ? "text-white" : "text-gray-800"
                }`}
              >
                {message.text}
              </Text>
              <Text
                className={`text-xs mt-2 ${
                  message.isUser ? "text-blue-100" : "text-gray-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            {message.isUser && (
              <View className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full items-center justify-center ml-3 mt-1 shadow-lg">
                <MaterialIcons name="person" size={18} color="white" />
              </View>
            )}
          </View>
        ))}

        {isTyping && (
          <View className="mx-4 mb-4 flex-row justify-start">
            <View className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full items-center justify-center mr-3 mt-1 shadow-lg">
              <MaterialIcons name="smart-toy" size={18} color="white" />
            </View>
            <View className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-gray-100">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
                <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
                <View className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <Text className="text-gray-500 italic ml-2">
                  AI is thinking...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View className="bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4">
        <Text className="text-sm font-semibold text-gray-700 mb-3">
          Quick Actions
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleQuickAction(action.query)}
              className="flex-row items-center bg-white/90 px-4 py-3 rounded-full mr-3 border border-gray-200 shadow-sm"
            >
              <MaterialIcons
                name={action.icon as any}
                size={16}
                color="#2563eb"
              />
              <Text className="text-sm text-gray-700 ml-2 font-medium">
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View className="bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 flex-row items-end">
        <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-3 max-h-32 border border-gray-200">
          <TextInput
            className="text-base color-gray-800 min-h-10"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about symptoms, medications, lifestyle..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!inputText.trim() || isTyping}
          className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${
            inputText.trim() && !isTyping
              ? "bg-gradient-to-r from-blue-600 to-indigo-600"
              : "bg-gray-300"
          }`}
        >
          <MaterialIcons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
