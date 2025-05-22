"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, FileType, Upload, ImageIcon } from "lucide-react"

export function FileUpload({
  file,
  setFile,
  imageData,
  setImageData,
}: {
  file: File | null
  setFile: (file: File | null) => void
  imageData: string | null
  setImageData: (data: string | null) => void
}) {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    // Check if it's a PDF or image
    const isPdf = selectedFile.type === "application/pdf"
    const isImage = selectedFile.type.startsWith("image/")

    if (!isPdf && !isImage) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPEG, PNG, etc.).",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    // If it's an image, create a data URL for preview and API
    if (isImage) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageData(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setImageData(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const clearFile = () => {
    setFile(null)
    setImageData(null)
  }

  return (
    <div className="space-y-4">
      {file ? (
        <Card className="p-4 relative flex items-center gap-3 sky-card">
          {file.type.startsWith("image/") && imageData ? (
            <div className="w-full">
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon className="h-8 w-8 text-skyBlue" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="relative w-full h-40 bg-gray-900 rounded-md overflow-hidden">
                <img src={imageData || "/placeholder.svg"} alt="Preview" className="w-full h-full object-contain" />
              </div>
            </div>
          ) : (
            <>
              <FileType className="h-8 w-8 text-skyBlue" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-white">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            className="absolute top-2 right-2 hover:bg-red-500/10 hover:text-red-500"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </Card>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            isDragging ? "border-skyBlue bg-skyBlue/5 shadow-sky-sm" : "border-gray-700"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <div
              className={`p-4 rounded-full ${isDragging ? "bg-skyBlue/10" : "bg-gray-900"} transition-colors duration-300`}
            >
              <Upload
                className={`h-8 w-8 ${isDragging ? "text-skyBlue" : "text-gray-400"} transition-colors duration-300`}
              />
            </div>
            <h3 className="text-lg font-medium text-white">Drag & drop your file</h3>
            <p className="text-sm text-gray-400 mb-2">or click to browse files (max 10MB)</p>
            <Input id="file-upload" type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              Browse files
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">Upload a PDF or image file (JPEG, PNG, etc.)</p>
    </div>
  )
}
