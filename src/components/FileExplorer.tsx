'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileEntry } from '@/utils/adb';
import { useDropzone } from 'react-dropzone';

interface FileExplorerProps {
  deviceId: string;
}

export default function FileExplorer({ deviceId }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDir, setIsCreatingDir] = useState(false);
  const [newDirName, setNewDirName] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/files?deviceId=${deviceId}&path=${encodeURIComponent(currentPath)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files');
      }

      setFiles(data.files);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [deviceId, currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('deviceId', deviceId);
      formData.append('path', `${currentPath}${file.name}`);
      formData.append('action', 'upload');
      formData.append('file', file);

      try {
        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upload file');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file');
      }
    }
    fetchFiles();
  }, [deviceId, currentPath, fetchFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCreateDirectory = async () => {
    if (!newDirName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('deviceId', deviceId);
      formData.append('path', `${currentPath}${newDirName}`);
      formData.append('action', 'createDir');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create directory');
      }

      setNewDirName('');
      setIsCreatingDir(false);
      fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create directory');
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const formData = new FormData();
      formData.append('deviceId', deviceId);
      formData.append('path', path);
      formData.append('action', 'delete');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }

      fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleDownload = async (path: string) => {
    try {
      window.open(
        `/api/files/download?deviceId=${deviceId}&path=${encodeURIComponent(path)}`,
        '_blank'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const navigateToParent = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.split('/').slice(0, -2).join('/') + '/';
    setCurrentPath(parentPath);
  };

  const navigateToDirectory = (dirName: string) => {
    setCurrentPath(`${currentPath}${dirName}/`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={navigateToParent}
            disabled={currentPath === '/'}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            ⬆️ Up
          </button>
          <span className="text-gray-600 dark:text-gray-300">{currentPath}</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCreatingDir(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            New Folder
          </button>
          <div
            {...getRootProps()}
            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer`}
          >
            <input {...getInputProps()} />
            Upload Files
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {isCreatingDir && (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newDirName}
            onChange={(e) => setNewDirName(e.target.value)}
            placeholder="New folder name"
            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleCreateDirectory}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create
          </button>
          <button
            onClick={() => setIsCreatingDir(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      <div className={`border-2 border-dashed rounded-lg p-8 ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-300 dark:border-gray-700'
      }`}>
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {files.length === 0 ? (
              <div {...getRootProps()} className="text-center">
                <input {...getInputProps()} />
                <p className="text-gray-500 dark:text-gray-400">
                  {isDragActive
                    ? 'Drop files here...'
                    : 'No files found. Click or drag and drop files to upload.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start justify-between"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() =>
                        file.type === 'directory' && navigateToDirectory(file.name)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {file.type === 'directory' ? '📁' : '📄'}
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {file.size} • {file.lastModified}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {file.type === 'file' && (
                        <button
                          onClick={() =>
                            handleDownload(`${currentPath}${file.name}`)
                          }
                          className="p-1 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          ⬇️
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDelete(`${currentPath}${file.name}`)
                        }
                        className="p-1 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 