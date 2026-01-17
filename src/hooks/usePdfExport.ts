import { useState } from 'react';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from '@/hooks/use-toast';
import { getPhotoFromIDB, getAllPhotosFromIDB } from '@/lib/photoStorage';

interface DiaryEntry {
  date: string;
  content: string;
  photos?: Array<{ filename: string; data?: string; base64?: string }>;
  tags?: string[];
  weather?: { temp?: number; description?: string };
  location?: { name?: string };
}

const STORAGE_KEY = 'diary-app-data';

const loadDiaryData = (): Record<string, any> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Fetch actual photo data from IndexedDB
const getPhotoData = async (filename: string, photoEntry?: { base64?: string; data?: string }): Promise<string | null> => {
  // First check if base64 is already available in the entry
  if (photoEntry?.base64) {
    return photoEntry.base64.startsWith('data:') 
      ? photoEntry.base64 
      : `data:image/jpeg;base64,${photoEntry.base64}`;
  }
  if (photoEntry?.data) {
    return photoEntry.data.startsWith('data:') 
      ? photoEntry.data 
      : `data:image/jpeg;base64,${photoEntry.data}`;
  }
  
  // Try to fetch from IndexedDB
  try {
    const base64 = await getPhotoFromIDB(filename);
    if (base64) {
      return base64.startsWith('data:') 
        ? base64 
        : `data:image/jpeg;base64,${base64}`;
    }
  } catch (e) {
    console.warn('Failed to fetch photo from IndexedDB:', filename, e);
  }
  
  return null;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportToPdf = async (options?: { 
    startDate?: Date; 
    endDate?: Date; 
    includePhotos?: boolean;
    title?: string;
  }) => {
    setIsExporting(true);
    setProgress(0);

    try {
      const data = loadDiaryData();
      const includePhotos = options?.includePhotos ?? true;
      const title = options?.title || 'My Diary';

      // Filter and sort entries
      let entries = Object.keys(data)
        .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key))
        .filter(key => {
          const entry = data[key];
          return entry?.content?.trim() || entry?.photos?.length > 0;
        })
        .sort();

      // Apply date filters
      if (options?.startDate) {
        const startStr = options.startDate.toISOString().split('T')[0];
        entries = entries.filter(d => d >= startStr);
      }
      if (options?.endDate) {
        const endStr = options.endDate.toISOString().split('T')[0];
        entries = entries.filter(d => d <= endStr);
      }

      if (entries.length === 0) {
        toast({
          title: 'No entries to export',
          description: 'Write some diary entries first!',
          variant: 'destructive',
        });
        setIsExporting(false);
        return;
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper to add new page
      const addNewPage = () => {
        pdf.addPage();
        yPosition = margin;
      };

      // Helper to check space and add page if needed
      const ensureSpace = (needed: number) => {
        if (yPosition + needed > pageHeight - margin) {
          addNewPage();
        }
      };

      // Title page
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pageWidth - titleWidth) / 2, pageHeight / 2 - 20);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      const subtitle = `${entries.length} entries`;
      const subtitleWidth = pdf.getTextWidth(subtitle);
      pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, pageHeight / 2);

      if (entries.length > 0) {
        const dateRange = `${formatDate(entries[0])} - ${formatDate(entries[entries.length - 1])}`;
        pdf.setFontSize(10);
        const rangeWidth = pdf.getTextWidth(dateRange);
        pdf.text(dateRange, (pageWidth - rangeWidth) / 2, pageHeight / 2 + 15);
      }

      // Entries
      for (let i = 0; i < entries.length; i++) {
        const dateKey = entries[i];
        const entry = data[dateKey];
        
        setProgress(Math.round(((i + 1) / entries.length) * 100));

        addNewPage();

        // Date header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(formatDate(dateKey), margin, yPosition);
        yPosition += 8;

        // Metadata line (weather, location, tags)
        const metaParts: string[] = [];
        if (entry.weather?.description) {
          metaParts.push(`${entry.weather.description}${entry.weather.temp ? ` ${entry.weather.temp}°` : ''}`);
        }
        if (entry.location?.name) {
          metaParts.push(entry.location.name);
        }
        if (entry.tags?.length > 0) {
          metaParts.push(entry.tags.map((t: string) => `#${t}`).join(' '));
        }

        if (metaParts.length > 0) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(120, 120, 120);
          pdf.text(metaParts.join(' • '), margin, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 8;
        }

        // Divider line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;

        // Content
        if (entry.content) {
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          // Clean up content (remove task markers, etc.)
          let cleanContent = entry.content
            .replace(/\[x\]/g, '☑')
            .replace(/\[\s?\]/g, '☐')
            .replace(/!\[photo\]\([^)]+\)/g, '') // Remove photo markers
            .trim();

          const lines = pdf.splitTextToSize(cleanContent, contentWidth);
          
          for (const line of lines) {
            ensureSpace(6);
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          }
        }

        // Photos
        if (includePhotos && entry.photos?.length > 0) {
          yPosition += 5;
          
          for (const photo of entry.photos) {
            try {
              ensureSpace(60);
              
              // Fetch actual photo data from IndexedDB or entry
              const imgData = await getPhotoData(photo.filename, photo);
              
              if (!imgData) {
                console.warn('No photo data found for:', photo.filename);
                continue;
              }
              
              const maxWidth = contentWidth;
              const maxHeight = 80;
              
              // Try to add image (jsPDF handles sizing)
              pdf.addImage(imgData, 'JPEG', margin, yPosition, maxWidth, maxHeight, undefined, 'MEDIUM');
              yPosition += maxHeight + 5;
            } catch (e) {
              console.warn('Failed to add photo:', e);
            }
          }
        }
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `diary-export-${timestamp}.pdf`;

      // Export based on platform
      if (Capacitor.isNativePlatform()) {
        const pdfOutput = pdf.output('datauristring');
        const base64Data = pdfOutput.split(',')[1];

        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        const uri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'My Diary Export',
          url: uri.uri,
          dialogTitle: 'Share your diary',
        });
      } else {
        // Web download
        pdf.save(filename);
      }

      toast({
        title: 'PDF exported successfully!',
        description: `${entries.length} entries exported`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error creating the PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return {
    exportToPdf,
    isExporting,
    progress,
  };
};
