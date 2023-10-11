// Import dependencies
import { ChatContainer, MainContainer, Message, MessageInput, MessageList, TypingIndicator } from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import * as cocossd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";

const API_KEY = "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";

const LanguageSelector = ({ onSelectLanguage }) => {
  const [language, setLanguage] = useState('en');

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    onSelectLanguage(selectedLanguage);
  };

  return (
    <div>
      <select value={language} onChange={handleLanguageChange}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="ru">Russian</option>
        <option value="fr">French</option>
        <option value="zh">Chinese</option>
      </select>
    </div>
  );
};

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [net, setNet] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [detectedLabels, setDetectedLabels] = useState([]);
  const [messages, setMessages] = useState([
    {
      message: "Ask me anything! I can also let you know what I can see in the camera!",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      const net = await cocossd.load();
      setNet(net);
    };
    loadModel();
  }, []);

  const detect = useCallback(async () => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const { videoWidth, videoHeight } = video;

      video.width = videoWidth;
      video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const obj = await net.detect(video);
      const labels = obj.map(prediction => prediction.class);
      setDetectedLabels(labels);

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawRect(obj, ctx, selectedLanguage);
    }
  }, [net, selectedLanguage]);

  useEffect(() => {
    if (net) {
      detect(); // initial detection

      const interval = setInterval(detect, 500);
      return () => clearInterval(interval);
    }
  }, [net, detect]);

  const getLanguageInstruction = () => {
    switch (selectedLanguage) {
      case 'es':
        return "Respond in Spanish";
      case 'ru':
        return "Respond in Russian";
      case 'fr':
        return "Respond in French";
      case 'zh':
        return "Respond in Chinese";
      default:
        return "Respond in English";
    }
  };

  const handleSend = async (message) => {
    let systemMessageContent;
    const languageInstruction = getLanguageInstruction();

    const visionKeywords = ["see", "detections", "views", "observes", "whats in the room", "view", "look", "watch", "spot", "detect", "percieve", "glimpse", "notice", "identify","spy", "spy","conceive", "make out", "identify", "grasp", "sight", "recognize", "observe"];
    const messageIncludesVisionKeyword = visionKeywords.some(keyword => message.toLowerCase().includes(keyword));

    const userMessage = {
      message: message,
      direction: 'outgoing',
      sender: "user"
    };

    let newMessages = [...messages, userMessage];

    if (messageIncludesVisionKeyword) {
        if (detectedLabels.length > 0) {
          systemMessageContent = `(${languageInstruction} <strong>From my current understanding, I can detect the following objects: ${detectedLabels.join(', ')}.</strong>)`;
        } else {
            systemMessageContent = `${languageInstruction} I don't detect any specific objects right now.`;
        }
    } else {
        systemMessageContent = `${languageInstruction} | User Asked: ${message}`;
    }

    const chatGPTMessage = {
        message: systemMessageContent,
        direction: 'incoming',
        sender: "ChatGPT"
    };

    newMessages.push(chatGPTMessage);
    setMessages(newMessages);

    setIsTyping(true);
    await processMessageToChatGPT(newMessages, systemMessageContent);
  };

async function processMessageToChatGPT(chatMessages, systemMessageContent) {
  let apiMessages = chatMessages.map((messageObject) => {
    let role = messageObject.sender === "ChatGPT" ? "assistant" : "user";
    return { role: role, content: messageObject.message }
  });

  const apiRequestBody = {
    "model": "gpt-3.5-turbo",
    "messages": [
      { "role": "system", "content": systemMessageContent }, // Ensure this is the message being sent
      ...apiMessages
    ]
  };

    await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "ChatGPT"
      }]);
      setIsTyping(false);
    });
  }

  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.error("Your browser does not support the Web Speech API. Please try another browser.");
      return;
    }
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)();

    recognition.onresult = (event) => {
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);
        handleSend(currentTranscript);
    };

    recognition.start();
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
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
      <div className="Webcam-section">
        <div className="Webcam-container">
          <Webcam
            ref={webcamRef}
            style={{
              zIndex: 1,
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              zIndex: 2,
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>
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
                  {messages.map((message, i) => {
                    return <Message key={i} model={message} />;
                  })}
                </MessageList>
              </ChatContainer>
            </MainContainer>
          </div>
          <div className="Chat-input">
            <button onClick={startListening}>Start Listening</button>
            <button onClick={() => speak(messages[messages.length - 1]?.message)}>Read Last Message</button>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;