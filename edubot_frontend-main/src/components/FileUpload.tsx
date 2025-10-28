import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { X, Paperclip, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';

interface FileUploadProps {
  chatId?: string;
  onFileUploaded?: (filename: string, fileId: string, newChatId?: string) => void;
}

export function FileUpload({ chatId, onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileSelect = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const user = apiService.getCurrentUser();
      if (!user) {
        toast.error('Please log in');
        setIsUploading(false);
        return;
      }

      let activeChatId = chatId;
      
      if (!activeChatId) {
        const createResponse = await fetch(
          `${apiService['baseUrl']}/api/chat/create?user_id=${user.id}&title=File: ${file.name.substring(0, 30)}&level=school`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (createResponse.ok) {
          const chatData = await createResponse.json();
          activeChatId = chatData.id || chatData.chat_id;
        } else {
          throw new Error('Failed to create chat');
        }
      }

      if (!activeChatId) throw new Error('No chat ID');

      const formData = new FormData();
      formData.append('file', file);

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
      toast.success('File uploaded!');
      onFileUploaded?.(response.filename, response.file_id, activeChatId);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="size-9 shrink-0 hover:bg-muted"
        title="Upload file"
      >
        {isUploading ? (
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        ) : (
          <Paperclip className="size-5 text-muted-foreground" />
        )}
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
          e.target.value = '';
        }}
      />
    </>
  );
}
