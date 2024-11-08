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
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { LoginDialog } from "@/components/login-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  type: "user" | "assistant";
  content: string;
  transcription?: string;
}

interface ChatHistory {
  history: {
    type: "user" | "assistant";
    content: string;
  }[];
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
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { toast } = useToast();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isUsageGuidelinesDialogOpen, setIsUsageGuidelinesDialogOpen] =
    useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && sessionId) {
      fetchHistory();
    } else {
      setChatHistory([]);
    }
  }, [isLoggedIn, sessionId]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      if (!data.session_id) {
        throw new Error("No session ID received");
      }

      localStorage.setItem("sessionId", data.session_id);

      setIsLoggedIn(true);
      setSessionId(data.session_id);

      toast({
        title: "Success",
        description: "You have successfully logged in.",
        variant: "custom",
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const fetchHistory = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch("https://agenticbosch.onrender.com/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setChatHistory(data.history);
      console.log("Chat history:", data);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();

      setIsLoggedIn(true);
      setSessionId(data.session_id);
      localStorage.setItem("sessionId", data.session_id);

      toast({
        title: "Success",
        description: "You have successfully registered and logged in.",
        variant: "custom",
      });
      console.log("Registered and logged in:", data);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isLoggedIn || !sessionId) {
      toast({
        title: "Log In",
        description: "Please log in or register to use the chatbot.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLoadingMessage("The agent is thinking...");

    try {
      const response = await fetch("https://agenticbosch.onrender.com/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        type: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        type: "assistant",
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
    if (!isLoggedIn || !sessionId) {
      toast({
        title: "Log In",
        description: "Please log in or register to use the chatbot.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("session_id", sessionId!);

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
      const assistantMessage: Message = {
        type: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
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

  // const renderSidebar = () => (
  //   <aside
  //     className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#333333] text-white p-4 transform transition-transform duration-300 ease-in-out ${
  //       isSidebarOpen ? "translate-x-0" : "-translate-x-full"
  //     } md:relative md:translate-x-0`}
  //   >
  //     <Button
  //       variant="outline"
  //       className="w-full justify-start mb-4 text-white"
  //       onClick={() => setMessages([])}
  //     >
  //       <PlusCircle className="mr-2 h-5 w-5" />
  //       New chat
  //     </Button>
  //     {/* <nav className="space-y-2">
  //       {isLoggedIn ? (
  //         <>
  //           {chatHistory.length > 0 ? (
  //             chatHistory.map((chat, index) => (
  //               <Button
  //                 key={index}
  //                 variant="outline"
  //                 className="w-full text-white text-wrap p-1"
  //                 onClick={() => {
  //                   setMessages(chat.history);
  //                   setIsSidebarOpen(false);
  //                 }}
  //               >
  //                 {chat.history[0]?.content.substring(0, 30)}...
  //               </Button>
  //             ))
  //           ) : (
  //             <p className="text-gray-400 text-center text-sm">
  //               No chat history available
  //             </p>
  //           )}
  //         </>
  //       ) : (
  //         <p className="text-gray-400 text-center text-sm">
  //           Please log in to see your chats.
  //         </p>
  //       )}
  //     </nav> */}
  //     <nav className="space-y-2">
  //       {isLoggedIn ? (
  //         <>
  //           {chatHistory.length > 0 ? (
  //             chatHistory.map((chat, index) => (
  //               <Button
  //                 key={index}
  //                 variant="outline"
  //                 className="w-full text-white text-wrap p-1"
  //                 onClick={() => {
  //                   setMessages(chat.history);
  //                   setIsSidebarOpen(false);
  //                 }}
  //               >
  //                 {chat.history && chat.history[0]
  //                   ? chat.history[0].content.substring(0, 30) + "..."
  //                   : "Empty chat"}
  //               </Button>
  //             ))
  //           ) : (
  //             <p className="text-gray-400 text-center text-sm">
  //               No chat history available
  //             </p>
  //           )}
  //         </>
  //       ) : (
  //         <p className="text-gray-400 text-center text-sm">
  //           Please log in to see your chats.
  //         </p>
  //       )}
  //     </nav>
  //     <div className="mt-auto pt-4 border-t border-[#444444] space-y-2">
  //       <Button
  //         variant="outline"
  //         className="w-full justify-start text-white"
  //         onClick={() => setIsHelpDialogOpen(true)}
  //       >
  //         <HelpCircle className="mr-2 h-5 w-5" />
  //         Help
  //       </Button>
  //       <Button
  //         variant="outline"
  //         className="w-full justify-start text-white"
  //         onClick={() => setIsUsageGuidelinesDialogOpen(true)}
  //       >
  //         <FileText className="mr-2 h-5 w-5" />
  //         Usage guidelines
  //       </Button>
  //     </div>
  //   </aside>
  // );

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
          // <>
          //   {chatHistory && chatHistory.length > 0 ? (
          //     chatHistory.map((chat, index) => (
          //       <Button
          //         key={index}
          //         variant="outline"
          //         className="w-full text-white text-wrap p-1"
          //         onClick={() => {
          //           setMessages(chat.history);
          //           setIsSidebarOpen(false);
          //         }}
          //       >
          //         {chat.history && chat.history.length > 0
          //           ? chat.history[0].content.substring(0, 30) + "..."
          //           : "Empty chat"}
          //       </Button>
          //     ))
          //   ) : (
          //     <p className="text-gray-400 text-center text-sm">
          //       No chat history available
          //     </p>
          //   )}
          // </>
          <p className="text-gray-400 text-center text-sm">
            No chat history available
          </p>
        ) : (
          <p className="text-gray-400 text-center text-sm">
            Please log in to see your chats.
          </p>
        )}
      </nav>
      <div className="mt-auto pt-4 border-t border-[#444444] space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start text-white"
          onClick={() => setIsHelpDialogOpen(true)}
        >
          <HelpCircle className="mr-2 h-5 w-5" />
          Help
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start text-white"
          onClick={() => setIsUsageGuidelinesDialogOpen(true)}
        >
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
            onClick={() => {
              if (isLoggedIn) {
                localStorage.removeItem("sessionId");
                setIsLoggedIn(false);
                setSessionId(null);
              } else {
                setIsLoginDialogOpen(true);
              }
            }}
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
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
      <Dialog open={isHelpDialogOpen} onOpenChange={setIsHelpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help</DialogTitle>
            <DialogDescription>
              Here you can find information on how to use the Bosch VTA Chatbot
              effectively.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Type your question in the input field at the bottom of the chat.
              </li>
              <li>
                Click the send button or press Enter to submit your question.
              </li>
              <li>
                Use the microphone button to ask questions via voice input.
              </li>
              <li>Browse your chat history in the sidebar (login required).</li>
            </ul>
            <h3 className="text-lg font-semibold mt-4 mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Be specific in your questions for more accurate answers.</li>
              <li>
                You can ask follow-up questions to get more detailed
                information.
              </li>
              <li>
                Use the 'New chat' button in the sidebar to start a fresh
                conversation.
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isUsageGuidelinesDialogOpen}
        onOpenChange={setIsUsageGuidelinesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usage Guidelines</DialogTitle>
            <DialogDescription>
              Please follow these guidelines when using the Bosch VTA Chatbot.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Do's</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Ask questions related to Bosch products, services, and
                technologies.
              </li>
              <li>
                Provide context to your questions for more accurate answers.
              </li>
              <li>
                Report any issues or bugs you encounter while using the chatbot.
              </li>
            </ul>
            <h3 className="text-lg font-semibold mt-4 mb-2">Don'ts</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Do not share personal or sensitive information in your queries.
              </li>
              <li>
                Avoid using offensive language or asking inappropriate
                questions.
              </li>
              <li>
                Do not rely on the chatbot for critical decision-making without
                verification.
              </li>
            </ul>
            <p className="mt-4">
              Remember, the Bosch VTA Chatbot is an AI assistant and may not
              always provide perfect answers. For critical information, please
              consult official Bosch documentation or contact customer support.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
