import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, GitBranch, Plus, Eye, Download, Copy, Calendar } from 'lucide-react';


export const VersionManager = ({ onClose }) => {
  const [versions, setVersions] = useState([
    {
      id: '1',
      name: 'Software Engineering Focus',
      targetSchool: 'Google',
      lastModified: '2024-01-15',
      isActive: true
    },
    {
      id: '2',
      name: 'Data Science Track',
      targetSchool: 'Microsoft',
      lastModified: '2024-01-10',
      isActive: false
    },
    {
      id: '3',
      name: 'Startup Focus',
      targetSchool: 'Y Combinator',
      lastModified: '2024-01-08',
      isActive: false
    }
  ]);

  const [newVersionName, setNewVersionName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createNewVersion = () => {
    if (!newVersionName.trim()) return;
    
    const newVersion = {
      id: Date.now().toString(),
      name: newVersionName,
      targetSchool: '',
      lastModified: new Date().toISOString().split('T')[0],
      isActive: false
    };
    
    setVersions([newVersion, ...versions]);
    setNewVersionName('');
    setShowCreateForm(false);
  };

  const setActiveVersion = (id) => {
    setVersions(versions.map(version => ({
      ...version,
      isActive: version.id === id
    })));
  };

  const duplicateVersion = (version) => {
    const duplicated = {
      ...version,
      id: Date.now().toString(),
      name: `${version.name} (Copy)`,
      lastModified: new Date().toISOString().split('T')[0],
      isActive: false
    };
    setVersions([duplicated, ...versions]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-cvBorder">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-6 h-6 text-cvAccent" />
            <h2 className="text-xl font-bold cv-heading">Version Manager</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Create New Version */}
            <Card className="border-cvBorder">
              <CardHeader>
                <CardTitle className="flex items-center justify-between cv-heading">
                  <span>Create New Version</span>
                  <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    size="sm"
                    className="bg-cvAccent hover:bg-cvAccentHover text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Version
                  </Button>
                </CardTitle>
                <CardDescription className="cv-body">
                  Create tailored versions of your CV for different schools or positions
                </CardDescription>
              </CardHeader>
              {showCreateForm && (
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      value={newVersionName}
                      onChange={(e) => setNewVersionName(e.target.value)}
                      placeholder="e.g., Tech Startup Focus, Research Position"
                      className="border-cvBorder focus:border-cvAccent"
                      onKeyPress={(e) => e.key === 'Enter' && createNewVersion()}
                    />
                    <Button
                      onClick={createNewVersion}
                      className="bg-cvAccent hover:bg-cvAccentHover text-white"
                    >
                      Create
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Existing Versions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold cv-heading">Your CV Versions</h3>
              {versions.map((version) => (
                <Card key={version.id} className={`border transition-colors ${
                  version.isActive ? 'border-cvAccent bg-blue-50' : 'border-cvBorder'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold cv-heading">{version.name}</h4>
                          {version.isActive && (
                            <Badge className="bg-cvAccent text-white">Active</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm cv-body">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Modified: {new Date(version.lastModified).toLocaleDateString()}</span>
                          </div>
                          {version.targetSchool && (
                            <div>
                              <span>Target: {version.targetSchool}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateVersion(version)}
                          className="border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Duplicate
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-cvAccent text-cvAccent hover:bg-cvAccent hover:text-white"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        
                        {!version.isActive && (
                          <Button
                            onClick={() => setActiveVersion(version.id)}
                            size="sm"
                            className="bg-cvAccent hover:bg-cvAccentHover text-white"
                          >
                            Set Active
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
