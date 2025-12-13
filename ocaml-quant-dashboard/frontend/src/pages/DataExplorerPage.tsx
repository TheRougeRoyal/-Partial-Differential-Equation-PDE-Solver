import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Upload, 
  Download, 
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/utils/api';
import type { Filters } from '@/types';

type DataType = 'predictions' | 'greeks' | 'backtests';

interface DataRecord {
  [key: string]: string | number | boolean | null;
}

export function DataExplorerPage() {
  const [dataType, setDataType] = useState<DataType>('predictions');
  const [data, setData] = useState<DataRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({ assets: [], models: [] });
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 50;

  // Fetch filters
  useEffect(() => {
    api.getFilters()
      .then((res) => {
        if (res.success && res.data) {
          setFilters(res.data);
        }
      })
      .catch((err: Error) => console.error('Failed to load filters:', err));
  }, []);

  // Fetch data when type, filters, or page changes
  useEffect(() => {
    fetchData();
  }, [dataType, selectedAsset, selectedModel, page]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        asset: selectedAsset || undefined,
        model: selectedModel || undefined,
        page,
        limit: pageSize,
      };

      let responseData: DataRecord[] = [];
      let total = 0;

      switch (dataType) {
        case 'predictions': {
          const res = await api.getPredictions(params);
          if (res.success && res.data) {
            responseData = res.data as unknown as DataRecord[];
            total = (res as { total?: number }).total || res.data.length;
          }
          break;
        }
        case 'greeks': {
          const res = await api.getGreeks(params);
          if (res.success && res.data) {
            responseData = res.data as unknown as DataRecord[];
            total = (res as { total?: number }).total || res.data.length;
          }
          break;
        }
        case 'backtests': {
          const res = await api.getBacktests(params);
          if (res.success && res.data) {
            responseData = res.data as unknown as DataRecord[];
            total = (res as { total?: number }).total || res.data.length;
          }
          break;
        }
      }

      if (responseData.length > 0) {
        setColumns(Object.keys(responseData[0]));
        setData(responseData);
        setTotalPages(Math.ceil(total / pageSize) || 1);
      } else {
        setColumns([]);
        setData([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    try {
      const result = await api.uploadCSV(file, dataType);
      if (result.success && result.data) {
        setUploadMessage(`Successfully uploaded ${result.data.recordCount || 0} records`);
      } else {
        setUploadMessage(result.error || 'Failed to upload file');
      }
      fetchData();
    } catch (err) {
      setUploadMessage('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = () => {
    // Create CSV content
    if (data.length === 0) return;
    
    const headers = columns.join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const val = row[col];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val ?? '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatValue = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(4);
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Explorer</h2>
          <p className="text-muted-foreground">
            Browse, filter, upload, and export your quantitative data
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Data Type Selector */}
            <div className="w-48">
              <Select value={dataType} onValueChange={(v: DataType) => { setDataType(v); setPage(1); }}>
                <SelectTrigger>
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predictions">Predictions</SelectItem>
                  <SelectItem value="greeks">Greeks</SelectItem>
                  <SelectItem value="backtests">Backtests</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset Filter */}
            <div className="w-48">
              <Select value={selectedAsset} onValueChange={(v) => { setSelectedAsset(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {filters.assets.map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Filter */}
            <div className="w-48">
              <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {filters.models.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </div>

            {/* Export Button */}
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={data.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {uploadMessage && (
            <div className="mt-4">
              <Badge variant={uploadMessage.includes('Success') ? 'success' : 'destructive'}>
                {uploadMessage}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Data
              </CardTitle>
              <CardDescription>
                {data.length} records displayed • Page {page} of {totalPages}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading data...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive">
              {error}
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No data available. Try adjusting filters or uploading a CSV file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(col => (
                      <TableHead key={col} className="whitespace-nowrap">
                        {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map(col => (
                        <TableCell key={col} className="font-mono text-sm whitespace-nowrap">
                          {formatValue(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
