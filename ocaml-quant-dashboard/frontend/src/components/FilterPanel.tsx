// Filter Panel component

import React from 'react';
import type { Filters, DatePreset } from '../types';

interface FilterPanelProps {
  filters: Filters;
  selectedAsset: string;
  selectedModel: string;
  selectedExperiment: string;
  datePreset: DatePreset;
  onAssetChange: (asset: string) => void;
  onModelChange: (model: string) => void;
  onExperimentChange: (experiment: string) => void;
  onDatePresetChange: (preset: DatePreset) => void;
}

const datePresets: { value: DatePreset; label: string }[] = [
  { value: '1D', label: '1 Day' },
  { value: '7D', label: '7 Days' },
  { value: '30D', label: '30 Days' },
  { value: 'ALL', label: 'All Time' },
];

export function FilterPanel({
  filters,
  selectedAsset,
  selectedModel,
  selectedExperiment,
  datePreset,
  onAssetChange,
  onModelChange,
  onExperimentChange,
  onDatePresetChange,
}: FilterPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      {/* Asset Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
        <select
          value={selectedAsset}
          onChange={(e) => onAssetChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Assets</option>
          {filters.assets.map((asset) => (
            <option key={asset} value={asset}>
              {asset}
            </option>
          ))}
        </select>
      </div>

      {/* Model Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Models</option>
          {filters.models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {/* Experiment Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Experiment</label>
        <select
          value={selectedExperiment}
          onChange={(e) => onExperimentChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Experiments</option>
          {filters.experiments.map((exp) => (
            <option key={exp} value={exp}>
              {exp}
            </option>
          ))}
        </select>
      </div>

      {/* Date Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onDatePresetChange(preset.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                datePreset === preset.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
