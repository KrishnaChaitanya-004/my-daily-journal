import { useState } from 'react';
import { FileText, Calendar, Image, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { usePdfExport } from '@/hooks/usePdfExport';

interface PdfExportDialogProps {
  trigger?: React.ReactNode;
}

export const PdfExportDialog = ({ trigger }: PdfExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('My Diary');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { exportToPdf, isExporting, progress } = usePdfExport();

  const handleExport = async () => {
    await exportToPdf({
      title,
      includePhotos,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Export as PDF
          </DialogTitle>
          <DialogDescription>
            Create a beautiful PDF book of your diary entries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="pdf-title">Book Title</Label>
            <Input
              id="pdf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Diary"
            />
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range (optional)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Include photos toggle */}
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="include-photos" className="flex items-center gap-2 cursor-pointer">
              <Image className="w-4 h-4" />
              Include Photos
            </Label>
            <Switch
              id="include-photos"
              checked={includePhotos}
              onCheckedChange={setIncludePhotos}
            />
          </div>

          {/* Progress bar when exporting */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Generating PDF...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Export button */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full gap-2"
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
