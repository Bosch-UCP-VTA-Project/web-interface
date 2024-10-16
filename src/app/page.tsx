"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SendHorizontalIcon,
  Loader2Icon,
  UserCircle2Icon,
  MenuIcon,
  MicIcon,
  Settings,
  HelpCircle,
  FileText,
  PlusCircle,
  XIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Message {
  type: "user" | "bot";
  content: string;
  transcription?: string;
}

export default function AskBoschChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLoadingMessage("The agent is thinking...");

    try {
      const response = await fetch("https://agenticbosch.onrender.com/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const botMessage: Message = {
        type: "bot",
        content: data.answer,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        type: "bot",
        content: "Sorry, I encountered an error while processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description:
          "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch("https://agenticbosch.onrender.com/audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send audio");
      }

      const data = await response.json();
      console.log(data);
      const userMessage: Message = { type: "user", content: data.transcribed };
      const botMessage: Message = {
        type: "bot",
        content: data.answer,
      };
      setMessages((prev) => [...prev, userMessage, botMessage]);
    } catch (error) {
      console.error("Error sending audio:", error);
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const RecordingAnimation = () => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 10 }}
    >
      <div className="bg-white rounded-full p-8">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <motion.circle
            cx="50"
            cy="50"
            r="30"
            stroke="#007BC0"
            strokeWidth="4"
            fill="none"
            initial={{ scale: 0.8, opacity: 0.2 }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="15"
            fill="#007BC0"
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>
      <div className="absolute bottom-10 text-white text-xl font-semibold">
        Recording...
      </div>
    </motion.div>
  );

  const renderSidebar = () => (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#333333] text-white p-4 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0`}
    >
      <Button
        variant="outline"
        className="w-full justify-start mb-4 text-white"
        onClick={() => setMessages([])}
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        New chat
      </Button>
      <nav className="space-y-2">
        {isLoggedIn ? (
          <>
            {[
              "Engaging in Productive Conversations",
              "Future of Vehicle Diagnostics",
              "Chat with Assistant",
            ].map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-white text-wrap p-1"
              >
                {item}
              </Button>
            ))}
          </>
        ) : (
          <p className="text-gray-400 text-center text-sm">
            Please log in to see your chats.
          </p>
        )}
      </nav>
      <div className="mt-auto pt-4 border-t border-[#444444] space-y-2">
        <Button variant="outline" className="w-full justify-start text-white">
          <Settings className="mr-2 h-5 w-5" />
          Settings
        </Button>
        <Button variant="outline" className="w-full justify-start text-white">
          <HelpCircle className="mr-2 h-5 w-5" />
          Help
        </Button>
        <Button variant="outline" className="w-full justify-start text-white">
          <FileText className="mr-2 h-5 w-5" />
          Usage guidelines
        </Button>
      </div>
    </aside>
  );

  const renderChatArea = () => (
    <ScrollArea
      className="flex-grow mb-4 p-4 rounded-lg bg-white border border-gray-200"
      ref={scrollAreaRef}
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 ${
              message.type === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-flex items-start max-w-[80%] ${
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  message.type === "user" ? "bg-[#007BC0]" : "bg-[#005691]"
                } ${message.type === "user" ? "ml-2" : "mr-2"}`}
              >
                {message.type === "user" ? (
                  <UserCircle2Icon className="w-6 h-6 text-white" />
                ) : (
                  <Settings className="w-6 h-6 text-white" />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-[#E6F3F9] text-[#007BC0]"
                    : "bg-[#F2F2F2] text-[#333333]"
                }`}
              >
                {message.type === "user" ? (
                  message.content
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ ...props }) => <p className="mb-2" {...props} />,
                      h1: ({ ...props }) => (
                        <h1 className="text-2xl font-bold mb-2" {...props} />
                      ),
                      h2: ({ ...props }) => (
                        <h2 className="text-xl font-bold mb-2" {...props} />
                      ),
                      h3: ({ ...props }) => (
                        <h3 className="text-lg font-bold mb-2" {...props} />
                      ),
                      ul: ({ ...props }) => (
                        <ul className="list-disc list-inside mb-2" {...props} />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          className="list-decimal list-inside mb-2"
                          {...props}
                        />
                      ),
                      li: ({ ...props }) => <li className="mb-1" {...props} />,
                      a: ({ ...props }) => (
                        <a
                          className="text-[#007BC0] hover:underline"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {loadingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-500 italic"
          >
            {loadingMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );

  return (
    <div className="flex h-screen bg-[#F2F2F2] text-[#333333] relative">
      {renderSidebar()}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <main className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 relative">
          <h1 className="text-2xl font-bold text-[#007BC0]">
            Bosch VTA Chatbot
          </h1>
          <Button
            onClick={() => setIsLoggedIn(!isLoggedIn)}
            className="bg-[#007BC0] hover:bg-[#005691] text-white"
          >
            {isLoggedIn ? "Logout" : "Login"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <XIcon className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </Button>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>
        </header>
        <div className="flex-grow flex flex-col p-4 overflow-hidden">
          {renderChatArea()}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Bosch products, services, or technologies..."
              className="flex-grow bg-white border-gray-300 text-[#333333] placeholder-gray-400"
            />
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`bg-[#007BC0] hover:bg-[#005691] text-white ${
                isRecording ? "animate-pulse" : ""
              }`}
            >
              <MicIcon className="w-5 h-5" />
              <span className="sr-only">
                {isRecording ? "Stop Recording" : "Start Recording"}
              </span>
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#007BC0] hover:bg-[#005691] text-white"
            >
              {isLoading ? (
                <Loader2Icon className="w-5 h-5 animate-spin" />
              ) : (
                <SendHorizontalIcon className="w-5 h-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </main>
      <AnimatePresence>{isRecording && <RecordingAnimation />}</AnimatePresence>
    </div>
  );
}
