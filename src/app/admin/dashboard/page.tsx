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

  const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${process.env.SERVER_URL}/documents/list`, {
        headers: getAuthHeader(),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized or Forbidden");
      }
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFiles(Array.isArray(data.manuals) ? data.manuals : []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch files";
      setError(message);
      toast({
        title: "Error",
        description: `${message}. Please try again or re-login.`,
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
      const response = await fetch(
        `${process.env.SERVER_URL}/documents/upload`,
        {
          method: "POST",
          headers: {
            ...getAuthHeader(),
          },
          body: formData,
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized or Forbidden");
      }
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Upload failed" }));
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();
      const newFile: Manual = {
        file_name: data.file_name,
      };

      fetchFiles();

      toast({
        title: "Success",
        description: "File uploaded successfully and processing started.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload file";
      toast({
        title: "Error",
        description: `${message}. Please try again or re-login.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <section id="upload" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload PDF technical manuals to the vector database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="relative"
                disabled={isUploading}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer sr-only"
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
                    Select PDF File
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Supported format: .pdf
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
              View technical manuals stored in the vector database
            </CardDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFiles}
              disabled={isLoading}
              className="mt-2 w-fit"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Refresh List
            </Button>
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
              <div className="text-center py-6 text-destructive">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchFiles}
                  className="mt-4"
                  disabled={isLoading}
                >
                  Retry
                </Button>
              </div>
            ) : files.length > 0 ? (
              <div className="grid gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-slate-100 rounded-lg border border-slate-200"
                  >
                    <File className="w-4 h-4 mr-3 text-primary flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">
                      {file.file_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No technical manuals found in the vector database.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
