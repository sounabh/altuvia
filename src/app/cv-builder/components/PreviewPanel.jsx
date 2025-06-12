import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye, Palette } from 'lucide-react';
import { ModernTemplate } from '../(templates)/ModernTemplate';
import { ClassicTemplate } from '../(templates)/ClassicTemplate';
import { MinimalTemplate } from '../(templates)/MinimalTemplate';


export const PreviewPanel = ({
  selectedTemplate,
  onTemplateChange,
}) => {
  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate />;
      case 'classic':
        return <ClassicTemplate />;
      case 'minimal':
        return <MinimalTemplate />;
      default:
        return <ModernTemplate />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Preview Header */}
      <div className="p-4 border-b border-cvBorder bg-cvLightBg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 cv-accent" />
            <h3 className="font-semibold cv-heading">Live Preview</h3>
          </div>
          <Button
            size="sm"
            className="bg-cvAccent hover:bg-cvAccentHover text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Palette className="w-4 h-4 cv-body" />
          <Label className="cv-body text-sm">Template:</Label>
          <Select value={selectedTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-[150px] border-cvBorder">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] transform scale-75 origin-top">
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};

const Label= ({ children, className }) => (
  <span className={className}>{children}</span>
);