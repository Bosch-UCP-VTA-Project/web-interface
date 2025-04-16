"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, File, Loader2 } from "lucide-react";

interface Manual {
  file_name: string;
}

export default function Dashboard() {
  const [files, setFiles] = useState<Manual[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${process.env.SERVER_URL}/documents/list`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminAuthenticated")}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFiles(Array.isArray(data.manuals) ? data.manuals : []);
    } catch (error) {
      setError("Failed to fetch files");
      toast({
        title: "Error",
        description: "Failed to fetch files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Only PDF files are accepted.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.SERVER_URL}/documents/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminAuthenticated")}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();
      const newFile: Manual = {
        file_name: data.file_name,
      };

      setFiles((prevFiles) => [...prevFiles, newFile]);

      toast({
        title: "Success",
        description: "File uploaded successfully to vector database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section id="upload" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload documents to the vector database for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="relative"
                disabled={isUploading}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Supported formats: .pdf
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="files" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vector Database Files</CardTitle>
            <CardDescription>
              View all documents stored in the vector database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading files...
                </p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="text-center py-6 text-destructive">{error}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchFiles}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : files.length > 0 ? (
              <div className="grid gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-slate-50 rounded-lg"
                  >
                    <File className="w-4 h-4 mr-2 text-primary" />
                    <span className="flex-1 text-sm">{file.file_name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No files have been uploaded yet
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
