
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play } from "lucide-react";
import { ProtomapsMap } from "./protomaps-map";
import { ResultsDisplay } from "./results-display";
import type { Boundary, Result } from "@/lib/data";
import { boundaries, resultsData } from "@/lib/data";
import { mapConfigRegistry } from "@/lib/config";
import type { MapConfig } from "@/lib/config";

function ActionPanel({
    selectedBoundary,
    isLoading,
    onRunPipeline,
}: {
    selectedBoundary: Boundary | null;
    isLoading: boolean;
    onRunPipeline: () => void;
}) {
    const { toast } = useToast();

    const handleExport = (platform: string) => {
        if (!selectedBoundary) {
            toast({
                variant: "destructive",
                title: "No Boundary Selected",
                description: "Please select a boundary on the map before exporting.",
            });
            return;
        }

        toast({
            title: `Exporting to ${platform}`,
            description: `Pushing audience for ${selectedBoundary.name} to ${platform}. (Simulated)`,
        });
        // Here you would add the actual API call
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                    Run data pipelines and export audiences to ad platforms.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                    <Button
                        onClick={onRunPipeline}
                        disabled={isLoading || !selectedBoundary}
                        className="w-full"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="mr-2 h-4 w-4" />
                        )}
                        Run Pipeline
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        {selectedBoundary
                            ? `This will process data for ${selectedBoundary.name}.`
                            : "Select a boundary to run the pipeline."}
                    </p>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <Button className="w-full" onClick={() => handleExport("Meta")}>
                        <img src="/meta-logo.svg" alt="Meta Logo" className="mr-2 h-4 w-4" />
                        Export to Meta
                    </Button>
                    <Button className="w-full" onClick={() => handleExport("Google")}>
                        <img src="/google-logo.svg" alt="Google Logo" className="mr-2 h-4 w-4" />
                        Export to Google
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function CivisightDashboard() {
    const [selectedBoundary, setSelectedBoundary] = useState<Boundary | null>(null);
    const [pipelineResult, setPipelineResult] = useState<Result | null>(null);
    const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
    const [allGeojsons, setAllGeojsons] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const defaultConfig = mapConfigRegistry.getDefault();
        setMapConfig(defaultConfig);

        // Fetch all boundary geojsons
        const fetchAllBoundaries = async () => {
            const geojsonPromises = boundaries.map(async (boundary) => {
                const response = await fetch(`/data/${boundary.id}.json`);
                if (!response.ok) {
                    console.error(`Failed to fetch boundary: ${boundary.id}`);
                    return [boundary.id, null];
                }
                const data = await response.json();
                return [boundary.id, data];
            });

            const geojsonResults = await Promise.all(geojsonPromises);
            setAllGeojsons(Object.fromEntries(geojsonResults.filter(r => r[1] !== null)));
        };
        fetchAllBoundaries();
    }, []);

    const handleBoundarySelect = useCallback((boundaryId: string | null) => {
        if (boundaryId) {
            const boundary = boundaries.find((b) => b.id === boundaryId) || null;
            setSelectedBoundary(boundary);
            setPipelineResult(boundary ? resultsData[boundary.id] : null);
        } else {
            setSelectedBoundary(null);
            setPipelineResult(null);
        }
    }, []);

    const handleRunPipeline = () => {
        if (!selectedBoundary) return;
        setIsLoading(true);
        toast({
            title: "Pipeline Started",
            description: `Processing data for ${selectedBoundary.name}. This will take a moment.`,
        });

        setTimeout(() => {
            setPipelineResult(resultsData[selectedBoundary.id]);
            setIsLoading(false);
            toast({
                title: "Pipeline Complete",
                description: `Latest data for ${selectedBoundary.name} is now available.`,
            });
        }, 2000);
    };

    return (
        <main className="flex-1 flex flex-col p-6 gap-6 overflow-auto">
            <header>
                <h1 className="text-3xl font-bold font-headline">
                    {selectedBoundary ? `Analysis for ${selectedBoundary.name}` : "Dashboard"}
                </h1>
                <p className="text-muted-foreground">
                    {selectedBoundary
                        ? "Audience insights and export actions."
                        : "Select a boundary on the map to get started."}
                </p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="flex-1">
                        <CardContent className="p-0 h-full w-full rounded-lg overflow-hidden border">
                            <ProtomapsMap
                                allGeojsons={allGeojsons}
                                mapConfig={mapConfig}
                                selectedBoundaryId={selectedBoundary?.id || null}
                                onBoundarySelect={handleBoundarySelect}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 grid grid-rows-2 gap-6">
                    <ResultsDisplay
                        result={pipelineResult}
                        isLoading={isLoading}
                        boundarySelected={!!selectedBoundary}
                    />
                    <ActionPanel
                        selectedBoundary={selectedBoundary}
                        isLoading={isLoading}
                        onRunPipeline={handleRunPipeline}
                    />
                </div>
            </div>
        </main>
    );
}