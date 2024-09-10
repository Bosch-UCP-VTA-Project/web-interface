'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizontalIcon, Loader2Icon, CarIcon, UserCircle2Icon, MenuIcon, MicIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from '@/hooks/use-toast'

interface Message {
  type: 'user' | 'bot'
  content: string
  sources?: { content: string }[]
  transcription?: string
}

export default function ResponsiveChatbotWithAudio() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { type: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const botMessage: Message = {
        type: 'bot',
        content: data.answer,
        sources: data.sources,
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        await sendAudioToBackend(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('http://localhost:8000/audio', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to send audio')
      }

      const data = await response.json()
      console.log(data)
      const userMessage: Message = { type: 'user', content: data.transcribed }
      const botMessage: Message = {
        type: 'bot',
        content: data.answer,
        sources: data.sources,
      }
      setMessages(prev => [...prev, userMessage, botMessage])
    } catch (error) {
      console.error('Error sending audio:', error)
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderChatArea = () => (
    <ScrollArea className="flex-grow mb-4 p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700" ref={scrollAreaRef}>
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div className={`inline-flex items-start max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-blue-600' : 'bg-emerald-600'} ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
                {message.type === 'user' ? (
                  <UserCircle2Icon className="w-6 h-6" />
                ) : (
                  <CarIcon className="w-6 h-6" />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-100'
                  }`}
              >
                {message.content}
                {/* {message.sources && (
                  <div className="mt-2 text-xs text-gray-300">
                    <strong>Sources:</strong>
                    <ul className="list-disc list-inside">
                      {message.sources.map((source, idx) => (
                        <li key={idx}>{source.content}</li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollArea>
  )

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800">
        <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Auto Technician Assistant
        </h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <MenuIcon className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gray-800 text-white">
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-2">How to use:</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Ask questions about car maintenance</li>
                <li>Inquire about specific car models</li>
                <li>Get help with diagnostics</li>
                <li>Learn about repair procedures</li>
                <li>Use the microphone to ask questions verbally</li>
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
        <div className="hidden md:flex md:w-1/4 flex-col bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">How to use:</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ask questions about car maintenance</li>
            <li>Inquire about specific car models</li>
            <li>Get help with diagnostics</li>
            <li>Learn about repair procedures</li>
            <li>Use the microphone to ask questions verbally</li>
          </ul>
        </div>
        <div className="flex-grow flex flex-col">
          {renderChatArea()}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about car maintenance, repairs, or diagnostics..."
              className="flex-grow bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`bg-gradient-to-r ${isRecording ? 'from-red-500 to-red-600' : 'from-purple-500 to-purple-600'} hover:from-purple-600 hover:to-purple-700 text-white`}
            >
              <MicIcon className="w-5 h-5" />
              <span className="sr-only">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white"
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
    </div>
  )
}