import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { createWorker } from "tesseract.js";
import { uploadDocumentToSupabase } from "@/lib/supabase";

export default function DocumentUploadCard({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [ocrText, setOcrText] = useState("");
  const [generateSummary, setGenerateSummary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [message, setMessage] = useState("");

  const extractTextFromImage = async (file: File): Promise<string> => {
    const worker = await createWorker("eng", 1, {
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          setOcrProgress(Math.round(m.progress * 100));
        }
      },
    });
    
    try {
      const imageUrl = URL.createObjectURL(file);
      const result = await worker.recognize(imageUrl);
      URL.revokeObjectURL(imageUrl);
      return result.data.text;
    } finally {
      await worker.terminate();
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For PDFs, we'll use a server-side API endpoint since pdf-parse needs Node.js
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/pdf-extract", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Failed to extract text from PDF");
    }
    
    const data = await response.json();
    return data.text;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setMessage("");
      setOcrText("");
      setFileUrl("");
      setOcrProgress(0);
      
      // Auto-extract text and upload to Supabase
      setLoading(true);
      setMessage("Uploading document...");
      
      try {
        // Upload to Supabase first
        const uploadedUrl = await uploadDocumentToSupabase(selectedFile, userId);
        setFileUrl(uploadedUrl);
        setMessage("Processing document...");
      } catch (error) {
        console.error("Upload error:", error);
        setMessage("Failed to upload document. Please try again.");
        setLoading(false);
        return;
      }
      
      try {
        let extractedText = "";
        
        if (selectedFile.type === "application/pdf") {
          setMessage("Extracting text from PDF...");
          extractedText = await extractTextFromPDF(selectedFile);
        } else if (selectedFile.type.startsWith("image/")) {
          setMessage("Running OCR on image...");
          extractedText = await extractTextFromImage(selectedFile);
        } else {
          setMessage("Unsupported file type. Please upload a PDF or image.");
          setLoading(false);
          return;
        }
        
        setOcrText(extractedText);
        setMessage(`Successfully extracted ${extractedText.length} characters. Review and edit if needed.`);
      } catch (error) {
        console.error("OCR error:", error);
        setMessage("Failed to extract text. You can manually paste text below.");
      } finally {
        setLoading(false);
        setOcrProgress(0);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !ocrText.trim()) {
      setMessage("Please select a file and provide the extracted text.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const fileType = file.type.includes("pdf") ? "pdf" : "image";

      const res = await fetch("/api/documents", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId,
          fileName: file.name,
          fileType,
          fileUrl,
          ocrText: ocrText.trim(),
          generateSummary,
        }),
      });

      if (res.ok) {
        setMessage("Document uploaded successfully!");
        setFile(null);
        setFileUrl("");
        setOcrText("");
        // Reset file input
        const fileInput = document.getElementById("document-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      setMessage("Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Document
        </CardTitle>
        <CardDescription>
          Upload a PDF or image document. Extracted text will be stored for reference.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-upload">Select File (PDF or Image)</Label>
          <Input
            id="document-upload"
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {file.type.includes("pdf") ? (
              <FileText className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            <span>{file.name}</span>
          </div>
        )}

        {loading && ocrProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-medium">{ocrProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="ocr-text">
            Extracted Text
            <span className="text-xs text-muted-foreground ml-2">
              (Auto-extracted - edit if needed)
            </span>
          </Label>
          <textarea
            id="ocr-text"
            className="w-full min-h-[150px] p-3 text-sm border rounded-md resize-y"
            placeholder="Text will appear here after OCR processing..."
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="generate-summary"
            checked={generateSummary}
            onChange={(e) => setGenerateSummary(e.target.checked)}
            disabled={loading}
          />
          <Label htmlFor="generate-summary" className="cursor-pointer">
            Generate AI summary for readability
          </Label>
        </div>

        {message && (
          <div
            className={`text-sm ${
              message.includes("success") ? "text-green-600" : message.includes("not yet") ? "text-blue-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <Button onClick={handleUpload} disabled={loading || !file || !ocrText.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {ocrProgress > 0 ? "Processing..." : "Uploading..."}
            </>
          ) : (
            "Upload Document"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
