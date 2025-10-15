import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { X, Upload, File, FileText, FileImage } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface FileUploadProps {
  chatId?: string;
  onFileUploaded?: (filename: string, fileId: string, newChatId?: string) => void;
  onCancel?: () => void;
}

export function FileUpload({ chatId, onFileUploaded, onCancel }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="size-8 text-blue-500" />;
    if (file.type === 'application/pdf') return <File className="size-8 text-red-500" />;
    if (file.type.includes('word')) return <FileText className="size-8 text-blue-600" />;
    return <FileText className="size-8 text-gray-500" />;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error('File type not supported. Please upload PDF, Word, text, or image files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const user = apiService.getCurrentUser();
      if (!user) {
        toast.error('Please log in to upload files');
        clearInterval(progressInterval);
        setIsUploading(false);
        return;
      }

      // FIXED: If no chatId, create a chat first
      let activeChatId = chatId;
      
      if (!activeChatId) {
        console.log('📎 No chat ID - creating new chat for file upload');
        
        try {
          const createResponse = await fetch(
            `${apiService['baseUrl']}/api/chat/create?user_id=${user.id}&title=File: ${selectedFile.name.substring(0, 30)}&level=school`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          if (createResponse.ok) {
            const chatData = await createResponse.json();
            activeChatId = chatData.id || chatData.chat_id;
            console.log('📎 Created new chat:', activeChatId);
          } else {
            throw new Error('Failed to create chat');
          }
        } catch (createError) {
          console.error('Failed to create chat:', createError);
          throw new Error('Failed to create chat for file upload');
        }
      }

      // FIXED: Validate chat_id exists
      if (!activeChatId) {
        throw new Error('No chat ID available for file upload');
      }

      console.log('📎 Uploading file with chat_id:', activeChatId);

      // FIXED: Create FormData and send with chat_id as query parameter
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch(
        `${apiService['baseUrl']}/api/chat/upload?chat_id=${activeChatId}&user_id=${user.id}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const response = await uploadResponse.json();
      
      console.log('✅ Upload successful:', response);
      
      setUploadProgress(100);
      
      setTimeout(() => {
        toast.success(`File "${response.filename}" uploaded successfully!`);
        onFileUploaded?.(response.filename, response.file_id, activeChatId);
        setSelectedFile(null);
        setUploadProgress(0);
      }, 500);
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      toast.error(error.message || 'Failed to upload file. Please try again.');
      setUploadProgress(0);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upload File</h3>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">Drop your file here</p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse files
          </p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
          >
            Choose File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-4">
            Supported: PDF, Word, Text, Images (max 10MB)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            {getFileIcon(selectedFile)}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
            >
              <X className="size-4" />
            </Button>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Upload complete!'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
