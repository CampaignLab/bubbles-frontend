
"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProtomapsMap } from "./protomaps-map";
import { Skeleton } from "./ui/skeleton";
import { mapConfigRegistry, type MapConfig } from "@/lib/config";
import { boundaries, type Boundary } from "@/lib/data";

export function MapView() {
    const [config, setConfig] = useState<MapConfig | null>(null);
    const [selectedBoundary, setSelectedBoundary] = useState<Boundary | null>(null);
    const [geojson, setGeojson] = useState<any | null>(null);


    useEffect(() => {
        const defaultConfig = mapConfigRegistry.getDefault();
        setConfig(defaultConfig);
    }, []);

    useEffect(() => {
        if (selectedBoundary?.id) {
            fetch(`/data/${selectedBoundary.id}.json`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    setGeojson(data);
                })
                .catch((error) => {
                    console.error("Error fetching geojson for boundary:", error);
                    setGeojson(null);
                });
        } else {
            setGeojson(null);
        }
    }, [selectedBoundary]);

    const handleBoundarySelect = (id: string) => {
        const newBoundary = boundaries.find((b) => b.id === id) || null;
        setSelectedBoundary(newBoundary);
    };

    if (!config) {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Geospatial View</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 -mt-4">
                    <Skeleton className="w-full h-full rounded-lg border" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Geospatial View</CardTitle>
                    <CardDescription>Select a boundary to view it on the map.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 -mt-4">
                    <div className="w-full h-full rounded-lg overflow-hidden border">
                        <ProtomapsMap
                            mapConfig={config}
                            allGeojsons={geojson ? { [selectedBoundary!.id]: geojson } : {}}
                            selectedBoundaryId={selectedBoundary?.id || null}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Boundary Selection</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Select
                        onValueChange={handleBoundarySelect}
                        value={selectedBoundary?.id || ""}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a boundary..." />
                        </SelectTrigger>
                        <SelectContent>
                            {boundaries.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedBoundary && (
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Data Source</h4>
                            <p className="text-xs text-foreground mt-1 break-all font-mono">
                                /public/data/{selectedBoundary.id}.json
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}