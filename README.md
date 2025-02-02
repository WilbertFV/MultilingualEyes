Use this link to try it out yourself! 

https://multilingual-eyes-app.vercel.app/ 

Multilingual Eyes App

Overview

The Multilingual Eyes App was developed before the release of multimodal transformers, serving as an early attempt to create a context-aware, multilingual application that bridges communication gaps through object detection and conversational AI. By integrating TensorFlow's COCO-SSD model for real-time object detection and OpenAI's ChatGPT for intelligent responses, the app translates detected objects into the user's preferred language while maintaining interactive, language-specific conversations.

Development Goals

The app aims to enhance real-world navigation and communication for both tourists and visually impaired individuals. Its design focuses on creating a seamless, multimodal experience by:

Object Detection: Identifying and labeling objects in real-time using COCO-SSD.

Multilingual Translation: Translating detected object labels into the user's chosen language.

Conversational AI: Providing context-aware responses in multiple languages using ChatGPT.

Voice Interaction: Supporting speech-to-text and text-to-speech functionalities for hands-free use.

Extensible Dataset

The app's dataset can be easily extended to include additional objects and languages, making it adaptable for specialized use cases. This flexibility enables broader applicability in various domains, including healthcare, defense, and education.

Use Cases

Travel Assistance: Helping tourists navigate foreign environments by translating signage and objects in real-time.

Assistive Technology: Assisting visually impaired individuals by identifying objects and providing spoken descriptions.

Medical Applications: Assisting healthcare professionals in multilingual environments by identifying medical equipment or translating instructions.

Military Use: Enabling autonomous navigation and real-time translation for secure operations in foreign territories.

How to Use the App

Select Your Preferred Language: Choose from English, Spanish, Russian, French, or Chinese.

Interact via Voice or Text:

Press the speech-to-text button to ask questions verbally.

Alternatively, type your questions directly into the chat interface.

Example Questions:

"What can you see?"  — The app will list detected objects, translated into your selected language.

"What can you do with what you see?"  — The app will provide context-aware suggestions based on detected objects.

General Chatbot Queries:

"What’s the capital of France?"  — The app will respond in your chosen language.

Key Features

Real-Time Object Detection: Detects and labels objects through your webcam.

Multilingual Translation: Automatically translates detected objects into the selected language.

Conversational AI: Chatbot responses adapt to the user's language and detected objects.

Voice-to-Text & Text-to-Speech: Hands-free interaction for both desktop and mobile users.

Technologies Used

TensorFlow.js and COCO-SSD Model: For real-time object detection.

React and Chat UI Kit: For building a responsive and intuitive user interface.

Web Speech API: Enables speech-to-text and text-to-speech functionalities.

OpenAI GPT Integration: Powers multilingual conversational responses.

Canvas API: For drawing bounding boxes around detected objects.

Custom Translation Functionality: Translates detected object labels into selected languages.

Compatibility

The app is fully compatible with desktop and mobile devices, offering a flexible, user-friendly experience across platforms.

Future Enhancements

Integration with multimodal transformers for enhanced context awareness.

Offline capabilities for object detection and translation.

Augmented Reality (AR) overlays for detected objects.

User customization for adding new languages and datasets.

Contribution and Community Access

We welcome contributions from the community to further develop and enhance the app's capabilities. To contribute:

Fork the repository.

Create a new branch (git checkout -b feature-branch).

Make your changes and commit them (git commit -m 'Add new feature').

Push to the branch (git push origin feature-branch).

Open a Pull Request.

