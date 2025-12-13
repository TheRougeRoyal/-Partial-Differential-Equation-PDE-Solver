import { BacktestRecord, PredictionRecord, GreekRecord, QueryParams } from './types';
export declare function setDataDirectory(dir: string): void;
export declare function getDataDirectory(): string;
export declare function getBacktests(params?: QueryParams): BacktestRecord[];
export declare function getPredictions(params?: QueryParams): PredictionRecord[];
export declare function getGreeks(params?: QueryParams): GreekRecord[];
export declare function paginate<T>(data: T[], page?: number, limit?: number): {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
};
export declare function addUploadedData(id: string, data: any[]): void;
export declare function getUploadedData(id: string): any[] | undefined;
export declare function getAllUploadedIds(): string[];
export declare function getUniqueAssets(): string[];
export declare function getUniqueModels(): string[];
export declare function getUniqueExperiments(): string[];
export declare function clearCache(): void;
export declare function parseUploadedCSV(buffer: Buffer): any[];
//# sourceMappingURL=csvParser.d.ts.map