import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Image as ImageIcon, FileText, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RadiologyImage {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  thumbnail?: string;
}

interface RadiologySectionProps {
  patientId: string;
}

const STORAGE_KEY = 'radiology_images';

const RadiologySection: React.FC<RadiologySectionProps> = ({ patientId }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load images from localStorage
  const [images, setImages] = useState<RadiologyImage[]>(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${patientId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    // Default sample images
    return [
      {
        id: '1',
        name: 'Chest X-Ray',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800',
        uploadedAt: '2024-01-15',
        thumbnail: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=200'
      },
      {
        id: '2',
        name: 'MRI Brain',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
        uploadedAt: '2024-02-20',
        thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200'
      }
    ];
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<RadiologyImage | null>(null);

  // Save to localStorage when images change
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_${patientId}`, JSON.stringify(images));
  }, [images, patientId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock upload - create local URLs for selected files
    const newImages: RadiologyImage[] = selectedFiles.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString().split('T')[0],
      thumbnail: URL.createObjectURL(file)
    }));

    setImages([...images, ...newImages]);
    setSelectedFiles([]);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.success(t('toast.imageUploaded'));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const isPDF = (type: string) => type === 'application/pdf';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            {t('radiology.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="radiology-upload"
            />
            <label 
              htmlFor="radiology-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('radiology.selectFiles')} (X-ray, MRI, CT, PDF)
              </span>
            </label>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('radiology.selectedFiles')}:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm"
                  >
                    {isPDF(file.type) ? (
                      <FileText className="w-4 h-4 text-destructive" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-primary" />
                    )}
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button 
                      onClick={() => removeSelectedFile(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                size="sm"
              >
                {isUploading ? t('radiology.uploading') : t('radiology.upload')}
              </Button>
            </div>
          )}

          {/* Images Grid */}
          {images.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('radiology.noImages')}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div 
                  key={image.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setPreviewImage(image)}
                >
                  {isPDF(image.type) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                      <FileText className="w-8 h-8 text-destructive" />
                      <span className="text-xs text-center truncate w-full">{image.name}</span>
                    </div>
                  ) : (
                    <img 
                      src={image.thumbnail || image.url} 
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-background" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-2">
                    <p className="text-xs text-background truncate">{image.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {previewImage && !isPDF(previewImage.type) && (
              <img 
                src={previewImage.url} 
                alt={previewImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
            {previewImage && isPDF(previewImage.type) && (
              <div className="w-full h-[70vh]">
                <iframe 
                  src={previewImage.url} 
                  className="w-full h-full rounded-lg border"
                  title={previewImage.name}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {t('radiology.uploadedOn')}: {previewImage && new Date(previewImage.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RadiologySection;
