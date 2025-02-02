// src/App.jsx
import {
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import * as cocossd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";

// Replace this API key with your actual key. In production, secure it appropriately.
const API_KEY = "[YOUR API KEY HERE";

const LanguageSelector = ({ onSelectLanguage }) => {
  const [language, setLanguage] = useState("en");

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    onSelectLanguage(selectedLanguage);
  };

  return (
    <div className="language-selector">
      <select className="language-dropdown" value={language} onChange={handleLanguageChange}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="ru">Russian</option>
        <option value="fr">French</option>
        <option value="zh">Chinese</option>
      </select>
    </div>
  );
};

const isMobileDevice = () =>
  typeof window.orientation !== "undefined" ||
  navigator.userAgent.indexOf("IEMobile") !== -1;

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [facingMode, setFacingMode] = useState(isMobileDevice() ? "environment" : "user");
  const [net, setNet] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [detectedLabels, setDetectedLabels] = useState([]);
  const [messages, setMessages] = useState([
    {
      message: "Ask me anything! I can also let you know what I can see in the camera!",
      sentTime: "just now",
      sender: "ChatGPT",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  // On mobile, delay camera activation until the user opts in
  const [showCamera, setShowCamera] = useState(!isMobileDevice());

  // Define lower video resolution for mobile to improve performance
  const videoConstraints = isMobileDevice()
    ? { facingMode: facingMode, width: 320, height: 240 }
    : { facingMode: facingMode, width: 640, height: 480 };

  useEffect(() => {
    const loadModel = async () => {
      const loadedNet = await cocossd.load();
      setNet(loadedNet);
    };
    loadModel();
  }, []);

  const detect = useCallback(async () => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4 &&
      canvasRef.current
    ) {
      const video = webcamRef.current.video;
      const { videoWidth, videoHeight } = video;
      video.width = videoWidth;
      video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const predictions = await net.detect(video);
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      drawRect(predictions, ctx, selectedLanguage);
      return predictions.map((prediction) => prediction.class);
    }
    return [];
  }, [net, selectedLanguage]);

  useEffect(() => {
    let isSubscribed = true;
    const detectAndUpdate = async () => {
      const labels = await detect();
      if (isSubscribed) {
        setDetectedLabels(labels);
      }
    };
    if (net && showCamera) {
      detectAndUpdate();
      const interval = setInterval(detectAndUpdate, 500);
      return () => {
        clearInterval(interval);
        isSubscribed = false;
      };
    }
  }, [net, detect, showCamera]);

  const handleCameraError = (error) => {
    if (isMobileDevice() && facingMode === "environment" && error.name === "OverconstrainedError") {
      setFacingMode("user");
    }
    console.error("Camera error:", error);
  };

  const getLanguageInstruction = () => {
    switch (selectedLanguage) {
      case "es":
        return "Respond in Spanish";
      case "ru":
        return "Respond in Russian";
      case "fr":
        return "Respond in French";
      case "zh":
        return "Respond in Chinese";
      default:
        return "Respond in English";
    }
  };

  const handleSend = async (message) => {
    const languageInstruction = getLanguageInstruction();
    const visionKeywords = [
      "see", "detections", "views", "observes", "whats in the room", "view",
      "look", "watch", "spot", "detect", "percieve", "glimpse", "notice",
      "identify", "spy", "conceive", "make out", "grasp", "sight", "recognize", "observe"
    ];
    const messageIncludesVisionKeyword = visionKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    let systemMessageContent;
    if (messageIncludesVisionKeyword && detectedLabels.length > 0) {
      systemMessageContent = `${languageInstruction} | Detected objects: ${detectedLabels.join(", ")}.`;
    } else {
      systemMessageContent = `${languageInstruction} | ${message}`;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message: message,
        direction: "outgoing",
        sender: "user",
      },
      {
        message: systemMessageContent,
        direction: "incoming",
        sender: "ChatGPT",
      },
    ]);

    setIsTyping(true);
    await processMessageToChatGPT(message, systemMessageContent);
  };

  async function processMessageToChatGPT(userMessage, systemMessageContent) {
    let apiMessages = [
      {
        role: "system",
        content:
          "You are a virtual assistant capable of understanding and describing objects detected in a camera feed. Respond to queries using the detected labels and in the language indicated by the user. Avoid referencing your own operational limitations or the fact that you are an AI.",
      },
      { role: "user", content: userMessage },
      { role: "assistant", content: systemMessageContent },
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-4", messages: apiMessages }),
      });
      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: data.choices[0].message.content,
          sender: "ChatGPT",
          direction: "incoming",
        },
      ]);
    } catch (error) {
      console.error("Error communicating with ChatGPT API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: "An error occurred while processing your request.",
          sender: "ChatGPT",
          direction: "incoming",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Your browser does not support the Web Speech API. Please try another browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      handleSend(currentTranscript);
    };
    recognition.start();
  };

  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      console.error("Your browser does not support the speechSynthesis API. Please try another browser.");
      return;
    }
    if (text) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      synth.speak(utterance);
    } else {
      console.warn("No message to read.");
    }
  };

  return (
    <div className="App">
      {/* Apply inline style to enforce fixed height on mobile */}
      <div className="Webcam-section" style={{ height: isMobileDevice() ? "40vh" : "auto" }}>
        {showCamera ? (
          <div className="Webcam-container">
            <Webcam
              ref={webcamRef}
              videoConstraints={videoConstraints}
              onUserMediaError={handleCameraError}
              style={{
                zIndex: 1,
                position: "relative",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                zIndex: 2,
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        ) : (
          <div className="camera-placeholder">
            <p>Camera is not active.</p>
            {isMobileDevice() && (
              <button onClick={() => setShowCamera(true)}>Activate Camera</button>
            )}
          </div>
        )}
      </div>
      <div className="Right-section">
        <LanguageSelector onSelectLanguage={setSelectedLanguage} />
        <div className="Chat-section">
          <div className="Chat-output">
            <MainContainer>
              <ChatContainer>
                <MessageList
                  scrollBehavior="smooth"
                  typingIndicator={isTyping ? <TypingIndicator content="Let me think..." /> : null}
                >
                  {messages.map((message, index) => (
                    <Message key={index} model={message} />
                  ))}
                </MessageList>
              </ChatContainer>
            </MainContainer>
          </div>
          <div className="Chat-input">
            <button onClick={startListening}>Start Listening</button>
            <button onClick={() => speak(messages[messages.length - 1]?.message)}>
              Read Last Message
            </button>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
